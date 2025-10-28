const { exec } = require('node:child_process');
const util = require('node:util');
const execPromise = util.promisify(exec);

/**
 * Get detailed printer status using Windows WMI (Works without SNMP)
 * @param {string} printerName - Name of the printer to check
 * @returns {Promise<Object>} Printer status information
 */
const getWindowsPrinterStatus = async (printerName) => {
  try {
    // PowerShell command to get printer status via WMI
    const psCommand = `
      $printer = Get-Printer -Name "${printerName.replaceAll('"', '`"')}" -ErrorAction Stop
      $status = @{
        Name = $printer.Name
        PrinterStatus = $printer.PrinterStatus
        JobCount = $printer.JobCount
        IsShared = $printer.Shared
        PortName = $printer.PortName
      }
      
      # Get detailed status from Win32_Printer
      $wmiPrinter = Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Name='$($printer.Name.Replace("'","''"))'"
      if ($wmiPrinter) {
        $status.PrinterState = $wmiPrinter.PrinterState
        $status.PrinterStatusDescription = switch($wmiPrinter.PrinterStatus) {
          1 { "Other" }
          2 { "Unknown" }
          3 { "Idle" }
          4 { "Printing" }
          5 { "Warmup" }
          6 { "Stopped Printing" }
          7 { "Offline" }
          default { "Unknown ($($wmiPrinter.PrinterStatus))" }
        }
        $status.DetectedErrorState = $wmiPrinter.DetectedErrorState
        $status.ErrorDescription = switch($wmiPrinter.DetectedErrorState) {
          0 { "None" }
          1 { "Other" }
          2 { "Unknown" }
          3 { "Cover Open" }
          4 { "Paper Jam" }
          5 { "Out of Paper" }
          6 { "Manual Feed Required" }
          7 { "Paper Problem" }
          8 { "Offline" }
          9 { "I/O Active" }
          10 { "Busy" }
          11 { "Printing" }
          12 { "Output Bin Full" }
          13 { "Not Available" }
          14 { "Waiting" }
          15 { "Processing" }
          16 { "Initialization" }
          17 { "Warming Up" }
          18 { "Toner/Ink Low" }
          19 { "Out of Toner/Ink" }
          20 { "Page Punt" }
          21 { "User Intervention Required" }
          22 { "Out of Memory" }
          23 { "Door Open" }
          24 { "Server Unknown" }
          25 { "Power Save" }
          default { "Unknown Error ($($wmiPrinter.DetectedErrorState))" }
        }
      }
      
      $status | ConvertTo-Json
    `;

    const { stdout, stderr } = await execPromise(
      `powershell -NoProfile -NonInteractive -Command "${psCommand.replaceAll('"', '\\"')}"`,
      { 
        timeout: 10000,
        windowsHide: true 
      }
    );

    if (stderr && !stderr.includes('WARNING')) {
      console.warn(`⚠️ PowerShell warning: ${stderr}`);
    }

    const status = JSON.parse(stdout);
    
    // Determine if printer can accept jobs
    const canPrint = determineCanPrint(status);
    
    return {
      success: true,
      printerName: status.Name,
      status: status.PrinterStatusDescription || 'Unknown',
      errorState: status.ErrorDescription || 'None',
      jobCount: status.JobCount || 0,
      canPrint: canPrint.canPrint,
      reason: canPrint.reason,
      details: {
        printerState: status.PrinterState,
        detectedErrorState: status.DetectedErrorState,
        portName: status.PortName,
        isShared: status.IsShared
      }
    };

  } catch (error) {
    console.error(`❌ Failed to get Windows printer status: ${error.message}`);
    
    // If we can't get status, assume printer is available
    // (Better to try and fail than to block all jobs)
    return {
      success: false,
      printerName,
      error: error.message,
      canPrint: true, // Default to true to avoid blocking
      reason: 'Could not verify printer status - assuming available'
    };
  }
};

/**
 * Determine if printer can accept print jobs based on its status
 * @param {Object} status - Printer status from WMI
 * @returns {Object} { canPrint: boolean, reason: string }
 */
const determineCanPrint = (status) => {
  // Error states that should prevent printing
  const blockingErrors = [
    5,  // Out of Paper
    4,  // Paper Jam
    8,  // Offline
    19, // Out of Toner/Ink
    21, // User Intervention Required
    23, // Door Open
    3,  // Cover Open
  ];

  // Warning states (can print but notify user)
  const warningErrors = [
    18, // Toner/Ink Low
    7,  // Paper Problem
    12, // Output Bin Full
  ];

  const errorState = status.DetectedErrorState;

  if (blockingErrors.includes(errorState)) {
    return {
      canPrint: false,
      reason: status.ErrorDescription || 'Printer has a critical error',
      isWarning: false
    };
  }

  if (warningErrors.includes(errorState)) {
    return {
      canPrint: true, // Can still print but warn user
      reason: status.ErrorDescription || 'Printer has a warning',
      isWarning: true
    };
  }

  // Printer status 7 = Offline
  if (status.PrinterStatusDescription === 'Offline') {
    return {
      canPrint: false,
      reason: 'Printer is offline',
      isWarning: false
    };
  }

  return {
    canPrint: true,
    reason: 'Printer is ready',
    isWarning: false
  };
};

/**
 * Check if printer is ready to print (quick check)
 * @param {string} printerName - Name of the printer
 * @returns {Promise<Object>} { canPrint: boolean, reason: string }
 */
const checkPrinterReady = async (printerName) => {
  const status = await getWindowsPrinterStatus(printerName);
  return {
    canPrint: status.canPrint,
    reason: status.reason,
    isWarning: status.details?.isWarning || false,
    fullStatus: status
  };
};

module.exports = {
  getWindowsPrinterStatus,
  checkPrinterReady,
  determineCanPrint
};
