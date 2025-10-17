// Printer Status Monitoring Service
// Monitors printer hardware status (paper, ink levels) during active print jobs
const Printer = require('../models/Printer');
const PrintJob = require('../models/PrintJob');
const { emitPrinterError, emitJobPaused, emitJobResumed } = require('./socketService');

class PrinterMonitorService {
  constructor() {
    this.monitoringInterval = null;
    this.checkIntervalMs = 10000; // Check every 10 seconds
    this.isRunning = false;
    this.pausedJobs = new Map(); // Track paused jobs
  }

  /**
   * Start monitoring printer status
   */
  start() {
    if (this.monitoringInterval) {
      console.log('🟡 Printer monitor is already running');
      return;
    }

    console.log('🚀 Starting printer status monitor...');
    console.log(`⏱️ Checking printer status every ${this.checkIntervalMs/1000} seconds`);
    this.isRunning = true;

    this.monitoringInterval = setInterval(() => {
      this.checkAllPrinters();
    }, this.checkIntervalMs);

    // Check immediately on start
    this.checkAllPrinters();
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isRunning = false;
      console.log('🛑 Printer status monitor stopped');
    }
  }

  /**
   * Check all printers for status issues
   */
  async checkAllPrinters() {
    try {
      // Get all active print jobs
      const activeJobs = await PrintJob.find({
        status: { $in: ['in-progress', 'printing'] }
      }).populate('printerId');

      if (activeJobs.length === 0) {
        return; // No active jobs to monitor
      }

      console.log(`🔍 Monitoring ${activeJobs.length} active print job(s)...`);

      for (const job of activeJobs) {
        if (!job.printerId) continue;

        const printer = await Printer.findById(job.printerId);
        if (!printer) continue;

        // Check printer status
        await this.checkPrinterStatus(printer, job);
      }

    } catch (error) {
      console.error('❌ Error monitoring printers:', error.message);
    }
  }

  /**
   * Check individual printer status and handle issues
   */
  async checkPrinterStatus(printer, job) {
    try {
      const issues = [];
      
      // Check paper level
      const paperLevel = printer.supplies?.paperLevel || printer.paperLevel || 100;
      if (paperLevel <= 0) {
        issues.push({
          type: 'out_of_paper',
          message: 'Printer is out of paper',
          details: `Paper level: ${paperLevel}%`
        });
      }

      // Check ink/toner level
      const inkLevel = this.getLowestInkLevel(printer);
      if (inkLevel <= 0) {
        issues.push({
          type: 'out_of_ink',
          message: 'Printer is out of ink/toner',
          details: `Ink level: ${inkLevel}%`
        });
      }

      // Check printer error status
      if (printer.status === 'error' || printer.status === 'offline') {
        issues.push({
          type: 'printer_error',
          message: `Printer is ${printer.status}`,
          details: `Printer status: ${printer.status}`
        });
      }

      // If issues found, pause the job
      if (issues.length > 0 && !job.currentPauseInfo?.isPaused) {
        await this.pauseJob(job, printer, issues[0]);
      }

      // If no issues and job was paused, resume it
      if (issues.length === 0 && job.currentPauseInfo?.isPaused) {
        await this.resumeJob(job, printer);
      }

    } catch (error) {
      console.error(`❌ Error checking printer ${printer.name}:`, error.message);
    }
  }

  /**
   * Get the lowest ink level from all colors
   */
  getLowestInkLevel(printer) {
    const inkLevels = printer.supplies?.inkLevel;
    if (inkLevels) {
      const levels = [
        inkLevels.black || 100,
        inkLevels.cyan || 100,
        inkLevels.magenta || 100,
        inkLevels.yellow || 100
      ];
      return Math.min(...levels);
    }
    return printer.supplies?.tonerLevel || printer.inkLevel || 100;
  }

  /**
   * Pause a print job due to printer issue
   */
  async pauseJob(job, printer, issue) {
    try {
      console.log(`⏸️ Pausing job ${job._id} - ${issue.message}`);

      // Update job status
      job.status = 'paused';
      job.currentPauseInfo = {
        isPaused: true,
        pausedAt: new Date(),
        reason: issue.type,
        details: issue.details
      };

      // Add to pause history
      if (!job.pauseHistory) {
        job.pauseHistory = [];
      }
      job.pauseHistory.push({
        pausedAt: new Date(),
        reason: issue.type,
        details: issue.details
      });

      await job.save();

      // Store in paused jobs map
      this.pausedJobs.set(job._id.toString(), {
        jobId: job._id,
        printerId: printer._id,
        pausedAt: new Date()
      });

      // Emit events
      emitPrinterError({
        printerId: printer._id,
        printerName: printer.name,
        jobId: job._id,
        reason: issue.message,
        details: issue.details
      });

      emitJobPaused({
        jobId: job._id,
        fileName: job.file.originalName,
        printerName: printer.name,
        userId: job.clerkUserId,
        reason: issue.message,
        details: issue.details
      });

      console.log(`✅ Job ${job._id} paused successfully`);

    } catch (error) {
      console.error(`❌ Error pausing job ${job._id}:`, error.message);
    }
  }

  /**
   * Resume a paused print job
   */
  async resumeJob(job, printer) {
    try {
      console.log(`▶️ Resuming job ${job._id} - Printer is ready`);

      // Update pause history
      if (job.pauseHistory && job.pauseHistory.length > 0) {
        const lastPause = job.pauseHistory[job.pauseHistory.length - 1];
        if (!lastPause.resumedAt) {
          lastPause.resumedAt = new Date();
        }
      }

      // Update job status
      job.status = 'in-progress'; // Resume back to in-progress
      job.currentPauseInfo = {
        isPaused: false,
        pausedAt: null,
        reason: null,
        details: null
      };

      await job.save();

      // Remove from paused jobs map
      this.pausedJobs.delete(job._id.toString());

      // Emit resume event
      emitJobResumed({
        jobId: job._id,
        fileName: job.file.originalName,
        printerName: printer.name,
        userId: job.clerkUserId
      });

      console.log(`✅ Job ${job._id} resumed successfully`);

      // TODO: Trigger queue processor to continue printing
      // This would integrate with your existing queue processor

    } catch (error) {
      console.error(`❌ Error resuming job ${job._id}:`, error.message);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      pausedJobsCount: this.pausedJobs.size
    };
  }
}

// Export singleton instance
const printerMonitor = new PrinterMonitorService();

module.exports = printerMonitor;
