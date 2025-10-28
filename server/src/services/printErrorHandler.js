/**
 * Print Error Handler Service
 * 
 * Handles print job errors and triggers SNMP monitoring to detect hardware issues.
 * Integrates with existing queue processor and notification system.
 */

const Notification = require('../models/Notification');
const Printer = require('../models/Printer');
const PrinterError = require('../models/PrinterError');
const { getIO } = require('./socketService');
const { monitorPrinter } = require('./snmpPrinterMonitor');

/**
 * Error type classification
 */
const ERROR_TYPES = {
  COMMUNICATION_FAILURE: 'communication_failure',
  FILE_ACCESS_ERROR: 'file_access_error',
  PRINTER_NOT_FOUND: 'printer_not_found',
  HARDWARE_ERROR: 'hardware_error',
  SETTINGS_ERROR: 'settings_error',
  UNKNOWN_ERROR: 'unknown_error',
};

/**
 * Parse error message to determine error type
 */
function classifyError(errorMessage) {
  const message = errorMessage.toLowerCase();
  
  if (message.includes('printer') && message.includes('not found')) {
    return ERROR_TYPES.PRINTER_NOT_FOUND;
  }
  
  if (message.includes('communication') || message.includes('unreachable') || message.includes('offline')) {
    return ERROR_TYPES.COMMUNICATION_FAILURE;
  }
  
  if (message.includes('file') || message.includes('path') || message.includes('enoent')) {
    return ERROR_TYPES.FILE_ACCESS_ERROR;
  }
  
  if (message.includes('paper') || message.includes('toner') || message.includes('jam')) {
    return ERROR_TYPES.HARDWARE_ERROR;
  }
  
  if (message.includes('duplex') || message.includes('color') || message.includes('setting')) {
    return ERROR_TYPES.SETTINGS_ERROR;
  }
  
  return ERROR_TYPES.UNKNOWN_ERROR;
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(errorType, originalError) {
  switch (errorType) {
    case ERROR_TYPES.COMMUNICATION_FAILURE:
      return 'Unable to communicate with printer. The printer may be offline or disconnected from the network.';
    
    case ERROR_TYPES.FILE_ACCESS_ERROR:
      return 'Unable to access the print file. The file may have been moved or deleted.';
    
    case ERROR_TYPES.PRINTER_NOT_FOUND:
      return 'The selected printer could not be found. It may have been removed or renamed.';
    
    case ERROR_TYPES.HARDWARE_ERROR:
      return 'Printer hardware error detected. Please check the printer for paper jams, low toner, or other issues.';
    
    case ERROR_TYPES.SETTINGS_ERROR:
      return 'Print settings are incompatible with this printer. Please adjust your settings and try again.';
    
    case ERROR_TYPES.UNKNOWN_ERROR:
    default:
      return `Print job failed: ${originalError}`;
  }
}

/**
 * Handle print job error
 * - Classifies the error
 * - Triggers SNMP monitoring if hardware-related
 * - Creates user notification
 * - Creates admin notification if needed
 * - Emits real-time alerts
 */
async function handlePrintError(printJob, errorMessage, printerDocument = null) {
  try {
    console.log('🔴 Handling print error...');
    console.log(`📄 Job ID: ${printJob._id}`);
    console.log(`❌ Error: ${errorMessage}`);
    
    // Classify the error
    const errorType = classifyError(errorMessage);
    console.log(`🏷️ Error type: ${errorType}`);
    
    // Get printer document if not provided
    let printer = printerDocument;
    if (!printer && printJob.printerId) {
      printer = await Printer.findById(printJob.printerId);
    }
    
    // Windows printer monitoring disabled - causes issues with some printers
    // Trigger Windows printer monitoring if hardware-related
    // if (errorType === ERROR_TYPES.HARDWARE_ERROR || errorType === ERROR_TYPES.COMMUNICATION_FAILURE) {
    //   if (printer && printer.systemInfo?.connectionType !== 'Virtual') {
    //     
    //     console.log('🔍 Triggering immediate Windows printer check due to print error...');
    //     
    //     // Run Windows monitoring immediately (async, don't wait)
    //     const { monitorWindowsPrinter } = require('./windowsPrinterMonitor');
    //     monitorWindowsPrinter(printer).then(() => {
    //       console.log('✅ Windows printer check completed');
    //     }).catch(error => {
    //       console.error('❌ Windows printer check failed:', error.message);
    //     });
    //   }
    // }
    
    console.log('ℹ️ Windows printer monitoring disabled for error handling');
    
    // Create user notification
    const userFriendlyMessage = getUserFriendlyMessage(errorType, errorMessage);
    
    const userNotification = await Notification.create({
      clerkUserId: printJob.clerkUserId,
      jobId: printJob._id,
      type: 'job_failed',
      title: '❌ Print Job Failed',
      message: userFriendlyMessage,
      priority: 'high',
      metadata: {
        printerId: printJob.printerId,
        errorCode: errorType,
        actionRequired: true,
        originalError: errorMessage,
      },
    });
    
    console.log('📢 User notification created:', userNotification._id);
    
    // Log error to PrinterError collection
    const errorTypeMapping = {
      [ERROR_TYPES.HARDWARE_ERROR]: 'Hardware Error',
      [ERROR_TYPES.COMMUNICATION_FAILURE]: 'Communication Error',
      [ERROR_TYPES.PRINTER_NOT_FOUND]: 'Offline',
      [ERROR_TYPES.FILE_ACCESS_ERROR]: 'Driver Error',
      [ERROR_TYPES.SETTINGS_ERROR]: 'Driver Error',
      [ERROR_TYPES.UNKNOWN_ERROR]: 'Other',
    };

    await PrinterError.create({
      printerName: printer?.name || 'Unknown Printer',
      printerId: printJob.printerId,
      errorType: errorTypeMapping[errorType] || 'Other',
      description: errorMessage,
      metadata: {
        affectedJobs: 1,
        errorCode: errorType,
        location: printer?.location,
        ipAddress: printer?.systemInfo?.ipAddress,
      },
    });

    // Create admin notification for critical errors
    if (errorType === ERROR_TYPES.HARDWARE_ERROR || 
        errorType === ERROR_TYPES.COMMUNICATION_FAILURE ||
        errorType === ERROR_TYPES.PRINTER_NOT_FOUND) {
      
      const adminNotification = await Notification.create({
        clerkUserId: 'system_admin', // Replace with actual admin IDs
        jobId: printJob._id,
        type: 'maintenance',
        title: `🚨 Print System Error: ${printer?.name || 'Unknown Printer'}`,
        message: `Print job ${printJob._id} failed with ${errorType}. User: ${printJob.userName || printJob.clerkUserId}. Error: ${errorMessage}`,
        priority: 'urgent',
        metadata: {
          printerId: printJob.printerId,
          errorCode: errorType,
          actionRequired: true,
          originalError: errorMessage,
          affectedUser: printJob.clerkUserId,
        },
      });
      
      console.log('📢 Admin notification created:', adminNotification._id);
    }
    
    // Emit real-time Socket.IO events
    const io = getIO();
    if (io) {
      // Emit to user
      io.to(printJob.clerkUserId).emit('print-error', {
        jobId: printJob._id,
        errorType,
        message: userFriendlyMessage,
        timestamp: new Date(),
      });
      
      // Emit to admins for critical errors
      if (errorType === ERROR_TYPES.HARDWARE_ERROR || 
          errorType === ERROR_TYPES.COMMUNICATION_FAILURE) {
        io.to('admin').emit('print-system-error', {
          jobId: printJob._id,
          printerId: printJob.printerId,
          printerName: printer?.name,
          errorType,
          errorMessage,
          userName: printJob.userName || printJob.clerkUserId,
          timestamp: new Date(),
        });
      }
    }
    
    // Update printer status if communication failure
    if (printer && errorType === ERROR_TYPES.COMMUNICATION_FAILURE) {
      printer.status = 'offline';
      await printer.save();
      console.log(`🔴 Printer ${printer.name} marked as offline`);
    }
    
    return {
      errorType,
      userFriendlyMessage,
      notificationCreated: true,
    };
    
  } catch (error) {
    console.error('❌ Error in handlePrintError:', error);
    return {
      errorType: ERROR_TYPES.UNKNOWN_ERROR,
      userFriendlyMessage: 'An error occurred while processing your print job',
      notificationCreated: false,
    };
  }
}

/**
 * Check printer health before sending job
 * Performs quick SNMP check if available
 */
async function checkPrinterHealth(printerId) {
  try {
    const printer = await Printer.findById(printerId);
    
    if (!printer) {
      return {
        healthy: false,
        error: 'Printer not found',
        canPrint: false,
      };
    }
    
    // Check if printer is active
    if (!printer.isActive) {
      return {
        healthy: false,
        error: 'Printer is disabled',
        canPrint: false,
      };
    }
    
    // Check if printer is in maintenance mode
    if (printer.status === 'maintenance' || printer.status === 'offline') {
      return {
        healthy: false,
        error: `Printer is ${printer.status}`,
        canPrint: false,
      };
    }
    
    // Check for known errors
    if (printer.lastKnownErrors && printer.lastKnownErrors.length > 0) {
      const criticalErrors = new Set(['noPaper', 'noToner', 'jammed', 'offline']);
      const hasCriticalError = printer.lastKnownErrors.some(err => criticalErrors.has(err));
      
      if (hasCriticalError) {
        return {
          healthy: false,
          error: `Printer has issues: ${printer.lastKnownErrors.join(', ')}`,
          canPrint: false,
          knownErrors: printer.lastKnownErrors,
        };
      }
    }
    
    // SNMP check disabled - causes issues with non-SNMP compatible printers
    // Quick SNMP check if supported (async, don't block)
    // if (printer.systemInfo?.ipAddress && 
    //     printer.systemInfo.ipAddress !== 'localhost' && 
    //     printer.systemInfo.connectionType !== 'Virtual') {
    //   
    //   // Trigger async check but don't wait
    //   monitorPrinter(printer).catch(error => {
    //     console.warn('⚠️ Background health check failed:', error.message);
    //   });
    // }
    
    console.log('ℹ️ SNMP monitoring disabled - skipping background health check');
    
    return {
      healthy: true,
      canPrint: true,
      printerName: printer.name,
    };
    
  } catch (error) {
    console.error('❌ Error checking printer health:', error);
    return {
      healthy: false,
      error: error.message,
      canPrint: false,
    };
  }
}

/**
 * Log detailed print error for diagnostics
 */
async function logPrintError(printJob, error, context = {}) {
  const errorLog = {
    timestamp: new Date(),
    jobId: printJob._id,
    printerId: printJob.printerId,
    userId: printJob.clerkUserId,
    fileName: printJob.file?.originalName,
    error: {
      message: error.message,
      stack: error.stack,
      type: classifyError(error.message),
    },
    context,
  };
  
  console.error('📋 PRINT ERROR LOG:', JSON.stringify(errorLog, null, 2));
  
  // You can also store this in a dedicated error logging collection if needed
  // await ErrorLog.create(errorLog);
}

module.exports = {
  handlePrintError,
  checkPrinterHealth,
  logPrintError,
  classifyError,
  getUserFriendlyMessage,
  ERROR_TYPES,
};
