const { exec } = require('node:child_process');
const util = require('node:util');
const os = require('node:os');
const execPromise = util.promisify(exec);

/**
 * Cross-platform printer job monitoring service
 * Monitors the actual OS print queue to detect when jobs complete
 */
class PrinterJobMonitor {
  constructor() {
    this.platform = os.platform();
    console.log(`🖨️ Printer Job Monitor initialized for platform: ${this.platform}`);
  }

  /**
   * Wait for all print jobs to complete on a specific printer
   * @param {string} printerName - Name of the printer to monitor
   * @param {number} maxWaitTimeMs - Maximum time to wait (default: 5 minutes)
   * @param {number} pollIntervalMs - How often to check (default: 2 seconds)
   * @returns {Promise<Object>} - Result with success status
   */
  async waitForPrinterToFinish(printerName, maxWaitTimeMs = 300000, pollIntervalMs = 2000) {
    const startTime = Date.now();
    let attempts = 0;
    
    console.log(`⏳ Monitoring printer "${printerName}" for job completion...`);
    console.log(`📊 Max wait time: ${maxWaitTimeMs / 1000}s, Poll interval: ${pollIntervalMs / 1000}s`);
    
    while (Date.now() - startTime < maxWaitTimeMs) {
      attempts++;
      
      try {
        const jobCount = await this.getPrinterJobCount(printerName);
        
        if (jobCount === 0) {
          const elapsedTime = Math.round((Date.now() - startTime) / 1000);
          console.log(`✅ Printer "${printerName}" queue is empty after ${elapsedTime}s (${attempts} checks)`);
          return {
            success: true,
            elapsedTimeMs: Date.now() - startTime,
            attempts,
            message: 'Printer queue is empty'
          };
        }
        
        // Log status periodically (every 5 attempts)
        if (attempts % 5 === 0) {
          const elapsedTime = Math.round((Date.now() - startTime) / 1000);
          console.log(`⏳ Printer "${printerName}" still has ${jobCount} job(s) in queue after ${elapsedTime}s...`);
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        
      } catch (error) {
        console.warn(`⚠️ Error checking printer queue (attempt ${attempts}):`, error.message);
        // Continue checking even if we hit an error
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }
    }
    
    // Timeout reached
    const elapsedTime = Math.round((Date.now() - startTime) / 1000);
    console.warn(`⚠️ Timeout waiting for printer "${printerName}" to finish after ${elapsedTime}s (${attempts} checks)`);
    
    return {
      success: false,
      elapsedTimeMs: Date.now() - startTime,
      attempts,
      message: 'Timeout waiting for printer to finish',
      timedOut: true
    };
  }

  /**
   * Get the number of jobs currently in the printer's queue
   * @param {string} printerName - Name of the printer
   * @returns {Promise<number>} - Number of jobs in queue
   */
  async getPrinterJobCount(printerName) {
    switch (this.platform) {
      case 'win32':
        return await this.getWindowsJobCount(printerName);
      case 'darwin':
        return await this.getMacOSJobCount(printerName);
      case 'linux':
        return await this.getLinuxJobCount(printerName);
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  /**
   * Get job count on Windows using PowerShell
   * @param {string} printerName - Name of the printer
   * @returns {Promise<number>} - Number of jobs
   */
  async getWindowsJobCount(printerName) {
    try {
      // Use Get-PrintJob to get jobs for this specific printer
      const psCommand = `
        $jobs = Get-PrintJob -PrinterName "${printerName.replaceAll('"', '`"')}" -ErrorAction SilentlyContinue
        if ($jobs) {
          $jobs.Count
        } else {
          0
        }
      `;

      const { stdout, stderr } = await execPromise(
        `powershell.exe -NoProfile -NonInteractive -Command "${psCommand.replaceAll('"', '\\"')}"`,
        { 
          timeout: 10000,
          windowsHide: true 
        }
      );

      if (stderr && !stderr.includes('WARNING')) {
        console.debug(`PowerShell stderr: ${stderr}`);
      }

      const jobCount = Number.parseInt(stdout.trim(), 10) || 0;
      return jobCount;

    } catch (error) {
      // If Get-PrintJob fails, try WMI as fallback
      try {
        const wmiCommand = `
          $jobs = Get-WmiObject -Query "SELECT * FROM Win32_PrintJob WHERE Name LIKE '%${printerName.replaceAll("'", "''")}%'"
          if ($jobs) {
            if ($jobs -is [Array]) { $jobs.Count } else { 1 }
          } else {
            0
          }
        `;

        const { stdout: wmiStdout } = await execPromise(
          `powershell.exe -NoProfile -NonInteractive -Command "${wmiCommand.replaceAll('"', '\\"')}"`,
          { 
            timeout: 10000,
            windowsHide: true 
          }
        );

        const jobCount = Number.parseInt(wmiStdout.trim(), 10) || 0;
        return jobCount;

      } catch (wmiError) {
        console.warn(`⚠️ Failed to get Windows job count for "${printerName}":`, error.message);
        // Return 0 to avoid blocking - assume no jobs if we can't check
        return 0;
      }
    }
  }

  /**
   * Get job count on macOS using CUPS
   * @param {string} printerName - Name of the printer
   * @returns {Promise<number>} - Number of jobs
   */
  async getMacOSJobCount(printerName) {
    try {
      // Use lpstat to check print queue
      const { stdout } = await execPromise(
        `lpstat -o "${printerName}" 2>/dev/null || echo "no jobs"`,
        { timeout: 10000 }
      );

      if (stdout.includes('no jobs') || stdout.trim() === '') {
        return 0;
      }

      // Count lines (each line is a job)
      const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
      return lines.length;

    } catch (error) {
      // Try alternative command: lpq
      try {
        const { stdout: lpqStdout } = await execPromise(
          `lpq -P "${printerName}" 2>/dev/null || echo "no entries"`,
          { timeout: 10000 }
        );

        if (lpqStdout.includes('no entries')) {
          return 0;
        }

        // Count job lines (skip header lines)
        const lines = lpqStdout.trim().split('\n').filter(line => 
          line.trim() !== '' && 
          !line.includes('Rank') && 
          !line.includes('no entries')
        );
        return Math.max(0, lines.length - 1); // Subtract 1 for header

      } catch (lpqError) {
        console.warn(`⚠️ Failed to get macOS job count for "${printerName}":`, error.message);
        return 0;
      }
    }
  }

  /**
   * Get job count on Linux using CUPS
   * @param {string} printerName - Name of the printer
   * @returns {Promise<number>} - Number of jobs
   */
  async getLinuxJobCount(printerName) {
    try {
      // Use lpstat to check print queue
      const { stdout } = await execPromise(
        `lpstat -o "${printerName}" 2>/dev/null || echo "no jobs"`,
        { timeout: 10000 }
      );

      if (stdout.includes('no jobs') || stdout.trim() === '') {
        return 0;
      }

      // Count lines (each line is a job)
      const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
      return lines.length;

    } catch (error) {
      // Try alternative: lpq command
      try {
        const { stdout: lpqStdout } = await execPromise(
          `lpq -P "${printerName}" 2>/dev/null || echo "no entries"`,
          { timeout: 10000 }
        );

        if (lpqStdout.includes('no entries')) {
          return 0;
        }

        // Count job lines
        const lines = lpqStdout.trim().split('\n').filter(line => 
          line.trim() !== '' && 
          !line.includes('Rank')
        );
        return Math.max(0, lines.length - 1);

      } catch (lpqError) {
        console.warn(`⚠️ Failed to get Linux job count for "${printerName}":`, error.message);
        return 0;
      }
    }
  }

  /**
   * Check if a printer is currently busy (has jobs in queue)
   * @param {string} printerName - Name of the printer
   * @returns {Promise<boolean>} - True if printer has jobs
   */
  async isPrinterBusy(printerName) {
    try {
      const jobCount = await this.getPrinterJobCount(printerName);
      return jobCount > 0;
    } catch (error) {
      console.warn(`⚠️ Error checking if printer is busy:`, error.message);
      // Assume not busy if we can't check
      return false;
    }
  }

  /**
   * Get detailed printer queue status
   * @param {string} printerName - Name of the printer
   * @returns {Promise<Object>} - Queue status details
   */
  async getPrinterQueueStatus(printerName) {
    try {
      const jobCount = await this.getPrinterJobCount(printerName);
      
      return {
        success: true,
        printerName,
        jobCount,
        isBusy: jobCount > 0,
        platform: this.platform,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        printerName,
        error: error.message,
        platform: this.platform,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const printerJobMonitor = new PrinterJobMonitor();

module.exports = printerJobMonitor;
