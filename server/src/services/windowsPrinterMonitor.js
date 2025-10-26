/**
 * Windows Printer Status Monitor
 * 
 * Monitors Windows printer queue status using WMI/PowerShell
 * Alternative to SNMP for local Windows printers
 */

const { exec } = require('node:child_process');
const { promisify } = require('node:util');
const execAsync = promisify(exec);
const Printer = require('../models/Printer');
const PrinterError = require('../models/PrinterError');
const Notification = require('../models/Notification');
const { getSocketIO } = require('./socketService');

/**
 * Get Windows printer status using PowerShell
 */
async function getWindowsPrinterStatus(printerName) {
  try {
    // PowerShell command to get printer status
    const psCommand = `Get-Printer -Name "${printerName}" | Select-Object Name, PrinterStatus, JobCount | ConvertTo-Json`;
    
    const { stdout, stderr } = await execAsync(`powershell.exe -Command "${psCommand}"`, {
      timeout: 10000
    });
    
    if (stderr) {
      throw new Error(stderr);
    }
    
    const printerInfo = JSON.parse(stdout);
    
    // Parse printer status
    const status = parsePrinterStatus(printerInfo.PrinterStatus);
    const jobCount = printerInfo.JobCount || 0;
    
    return {
      success: true,
      printerName: printerInfo.Name,
      status: status.status,
      errors: status.errors,
      jobCount,
      hasErrors: status.errors.length > 0,
    };
    
  } catch (error) {
    console.error(`❌ Failed to get Windows printer status:`, error.message);
    return {
      success: false,
      error: error.message,
      status: 'offline',
      errors: ['offline'],
      hasErrors: true,
    };
  }
}

/**
 * Parse Windows printer status code to readable status
 */
function parsePrinterStatus(statusCode) {
  const errors = [];
  let status = 'online';
  
  // Windows printer status codes (bitwise flags)
  // 0 = Normal
  // 1 = Paused
  // 2 = Error
  // 3 = Pending Deletion
  // 4 = Paper Jam
  // 5 = Paper Out
  // 6 = Manual Feed Required
  // 7 = Paper Problem
  // 8 = Offline
  // 9 = I/O Active
  // 10 = Busy
  // 11 = Printing
  // 12 = Output Bin Full
  // 13 = Not Available
  // 14 = Waiting
  // 15 = Processing
  // 16 = Initialization
  // 17 = Warming Up
  // 18 = Toner/Ink Low
  // 19 = No Toner/Ink
  // 20 = Page Punt
  // 21 = User Intervention Required
  // 22 = Out of Memory
  // 23 = Door Open
  
  if (!statusCode || statusCode === 0) {
    return { status: 'online', errors: [] };
  }
  
  // Check for specific error conditions
  if (statusCode & 2) { // Error
    errors.push('general_error');
    status = 'maintenance';
  }
  
  if (statusCode & 4) { // Paper Jam
    errors.push('jammed');
    status = 'maintenance';
  }
  
  if (statusCode & 5) { // Paper Out
    errors.push('noPaper');
    status = 'maintenance';
  }
  
  if (statusCode & 8) { // Offline
    errors.push('offline');
    status = 'offline';
  }
  
  if (statusCode & 18) { // Low Toner
    errors.push('lowToner');
  }
  
  if (statusCode & 19) { // No Toner
    errors.push('noToner');
    status = 'maintenance';
  }
  
  if (statusCode & 23) { // Door Open
    errors.push('doorOpen');
    status = 'maintenance';
  }
  
  return { status, errors };
}

/**
 * Monitor Windows printer and create notifications
 */
async function monitorWindowsPrinter(printer) {
  try {
    console.log(`🔍 Monitoring Windows printer: ${printer.name}`);
    
    const statusInfo = await getWindowsPrinterStatus(printer.name);
    
    if (!statusInfo.success) {
      console.error(`❌ Failed to monitor printer ${printer.name}`);
      return;
    }
    
    // Check for new errors
    const previousErrors = printer.lastKnownErrors || [];
    const newErrors = statusInfo.errors.filter(error => !previousErrors.includes(error));
    
    // Map status to printer status
    let printerStatus = statusInfo.status;
    if (statusInfo.hasErrors) {
      printerStatus = 'offline'; // Set to offline when errors occur
    }
    
    // Update printer in database
    printer.status = printerStatus;
    printer.lastChecked = new Date();
    printer.lastKnownErrors = statusInfo.errors;
    
    await printer.save();
    
    // Create admin notification AND save error to PrinterError collection if there are new errors
    if (newErrors.length > 0) {
      await createWindowsPrinterNotification(printer, statusInfo.errors);
      await saveErrorsToDatabase(printer, newErrors);
    }
    
    console.log(`✅ Printer ${printer.name} monitored - Status: ${statusInfo.status}, Errors: ${statusInfo.errors.length}`);
    
  } catch (error) {
    console.error(`❌ Error monitoring printer ${printer.name}:`, error.message);
  }
}

/**
 * Save detected errors to PrinterError collection
 */
async function saveErrorsToDatabase(printer, errors) {
  try {
    const errorTypeMapping = {
      noPaper: 'Out of Paper',
      lowToner: 'Low Toner',
      noToner: 'Out of Toner',
      jammed: 'Paper Jam',
      offline: 'Offline',
      doorOpen: 'Door Open',
      general_error: 'Hardware Error',
    };
    
    const errorMessages = {
      noPaper: 'Paper tray is empty',
      lowToner: 'Toner level is low',
      noToner: 'Toner cartridge is empty',
      jammed: 'Paper jam detected',
      offline: 'Printer is offline',
      doorOpen: 'Printer door is open',
      general_error: 'Printer error detected',
    };
    
    for (const error of errors) {
      await PrinterError.create({
        printerName: printer.name,
        printerId: printer._id,
        errorType: errorTypeMapping[error] || 'Other',
        description: errorMessages[error] || error,
        status: 'unresolved',
        metadata: {
          location: printer.location,
          ipAddress: printer.systemInfo?.ipAddress,
          errorCode: error,
          source: 'windows_monitor',
        },
      });
    }
    
    console.log(`💾 Saved ${errors.length} error(s) to database for printer ${printer.name}`);
  } catch (error) {
    console.error('❌ Error saving to database:', error);
  }
}

/**
 * Create admin notification for Windows printer errors
 */
async function createWindowsPrinterNotification(printer, errors) {
  try {
    const errorMessages = {
      noPaper: 'Paper tray is empty',
      lowToner: 'Toner level is low',
      noToner: 'Toner cartridge is empty',
      jammed: 'Paper jam detected',
      offline: 'Printer is offline',
      doorOpen: 'Printer door is open',
      general_error: 'Printer error detected',
    };
    
    const message = errors.map(e => errorMessages[e] || e).join('; ');
    
    // Determine priority
    const urgentErrors = new Set(['jammed', 'offline', 'noPaper', 'noToner']);
    const hasUrgentError = errors.some(e => urgentErrors.has(e));
    const priority = hasUrgentError ? 'urgent' : 'high';
    
    // Create notification
    const notification = await Notification.create({
      clerkUserId: 'system_admin',
      type: 'maintenance',
      title: `⚠️ Printer Issue: ${printer.name}`,
      message,
      priority,
      metadata: {
        printerId: printer._id,
        errorCode: errors.join(','),
        actionRequired: true,
      },
    });
    
    console.log(`📢 Admin notification created for printer ${printer.name}`);
    
    // Emit Socket.IO event
    const io = getSocketIO();
    if (io) {
      io.to('admin').emit('printer-error', {
        printerId: printer._id,
        printerName: printer.name,
        errors,
        alertMessage: message,
        priority,
        timestamp: new Date(),
      });
    }
    
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
  }
}

/**
 * Monitor all Windows printers
 */
async function monitorAllWindowsPrinters() {
  try {
    const printers = await Printer.find({ 
      isActive: true,
      $or: [
        { 'systemInfo.connectionType': { $exists: false } },
        { 'systemInfo.connectionType': 'Network' },
        { 'systemInfo.connectionType': 'USB' }
      ]
    });
    
    console.log(`🖨️ Starting Windows printer monitoring for ${printers.length} printers...`);
    
    for (const printer of printers) {
      await monitorWindowsPrinter(printer);
    }
    
    console.log('✅ Printer monitoring cycle completed');
    
  } catch (error) {
    console.error('❌ Error in printer monitoring:', error);
  }
}

module.exports = {
  getWindowsPrinterStatus,
  monitorWindowsPrinter,
  monitorAllWindowsPrinters,
  parsePrinterStatus,
};
