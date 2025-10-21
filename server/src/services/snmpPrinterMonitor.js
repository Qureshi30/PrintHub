const snmp = require('net-snmp');
const Printer = require('../models/Printer');
const Notification = require('../models/Notification');
const { getSocketIO } = require('./socketService');

/**
 * SNMP OID Definitions for Printer Monitoring
 * Based on RFC 3805 (Printer MIB) and RFC 2790 (Host Resources MIB)
 */
const SNMP_OIDS = {
  // hrPrinterDetectedErrorState - Returns a byte with error bits
  // Location: 1.3.6.1.2.1.25.3.5.1.2.1
  ERROR_STATE: '1.3.6.1.2.1.25.3.5.1.2.1',
  
  // prtAlertDescription - Returns readable error description
  // Location: 1.3.6.1.2.1.43.18.1.1.8.1.1
  ALERT_DESCRIPTION: '1.3.6.1.2.1.43.18.1.1.8.1.1',
  
  // Additional useful OIDs
  PRINTER_STATUS: '1.3.6.1.2.1.25.3.5.1.1.1', // hrPrinterStatus
  PAGE_COUNT: '1.3.6.1.2.1.43.10.2.1.4.1.1', // prtMarkerLifeCount
  DEVICE_STATUS: '1.3.6.1.2.1.25.3.2.1.5.1', // hrDeviceStatus
};

/**
 * Error bit mapping for hrPrinterDetectedErrorState
 * Each bit represents a specific printer error condition
 */
const ERROR_BITS = {
  0: 'lowPaper',           // Bit 0: Paper is running low
  1: 'noPaper',            // Bit 1: Paper tray is empty
  2: 'lowToner',           // Bit 2: Toner/ink is running low
  3: 'noToner',            // Bit 3: Toner/ink is empty
  4: 'doorOpen',           // Bit 4: Printer door/cover is open
  5: 'jammed',             // Bit 5: Paper jam detected
  6: 'offline',            // Bit 6: Printer is offline
  7: 'serviceRequested',   // Bit 7: Service/maintenance required
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  lowPaper: 'Paper level is running low',
  noPaper: 'Paper tray is empty - please refill',
  lowToner: 'Toner/ink level is running low',
  noToner: 'Toner/ink cartridge is empty - replacement needed',
  doorOpen: 'Printer door or cover is open',
  jammed: 'Paper jam detected - please clear',
  offline: 'Printer is offline or unreachable',
  serviceRequested: 'Maintenance or service required',
};

/**
 * Priority mapping for different error types
 */
const ERROR_PRIORITIES = {
  noPaper: 'high',
  noToner: 'high',
  jammed: 'urgent',
  offline: 'urgent',
  doorOpen: 'high',
  lowPaper: 'medium',
  lowToner: 'medium',
  serviceRequested: 'medium',
};

/**
 * Create SNMP session for a printer
 * @param {string} ipAddress - IP address of the printer
 * @param {string} community - SNMP community string (default: 'public')
 * @returns {Object} SNMP session object
 */
function createSNMPSession(ipAddress, community = 'public') {
  const session = snmp.createSession(ipAddress, community, {
    port: 161,
    retries: 2,
    timeout: 5000,
    version: snmp.Version2c,
  });
  
  return session;
}

/**
 * Decode error state byte into individual error flags
 * The byte contains 8 bits, each representing a different error condition
 * @param {Buffer|Array} errorState - Error state byte from SNMP
 * @returns {Array<string>} Array of active error names
 */
function decodeErrorBits(errorState) {
  const errors = [];
  
  if (!errorState || errorState.length === 0) {
    return errors;
  }
  
  // Get the byte value (errorState might be Buffer or Array)
  const errorByte = errorState[0] || 0;
  
  // Check each bit (0-7) to see if it's set
  for (let bit = 0; bit < 8; bit++) {
    // Bit mask: check if bit is set using bitwise AND
    if (errorByte & (1 << bit)) {
      const errorName = ERROR_BITS[bit];
      if (errorName) {
        errors.push(errorName);
      }
    }
  }
  
  return errors;
}

/**
 * Get printer errors from SNMP
 * Queries both the error state bits and alert description
 * @param {Object} session - SNMP session object
 * @returns {Promise<Object>} Object containing errors array and alert message
 */
async function getPrinterErrors(session) {
  return new Promise((resolve, reject) => {
    const oids = [SNMP_OIDS.ERROR_STATE, SNMP_OIDS.ALERT_DESCRIPTION];
    
    session.get(oids, (error, varbinds) => {
      if (error) {
        return reject(error);
      }
      
      let errorState = null;
      let alertMessage = null;
      
      // Process the SNMP response
      for (const varbind of varbinds) {
        // Check if this OID returned an error
        if (snmp.isVarbindError(varbind)) {
          console.warn(`⚠️ SNMP error for OID ${varbind.oid}:`, snmp.varbindError(varbind));
          continue;
        }
        
        // Parse error state (first OID)
        if (varbind.oid === SNMP_OIDS.ERROR_STATE) {
          errorState = varbind.value;
        }
        
        // Parse alert description (second OID)
        if (varbind.oid === SNMP_OIDS.ALERT_DESCRIPTION) {
          alertMessage = varbind.value.toString();
        }
      }
      
      // Decode error bits into readable error names
      const errors = decodeErrorBits(errorState);
      
      resolve({
        errors,
        alertMessage: alertMessage || (errors.length > 0 ? errors.map(e => ERROR_MESSAGES[e]).join('; ') : null),
      });
    });
  });
}

/**
 * Get comprehensive printer status including errors and page count
 * @param {string} ipAddress - IP address of the printer
 * @param {string} community - SNMP community string
 * @returns {Promise<Object>} Complete printer status
 */
async function getPrinterStatus(ipAddress, community = 'public') {
  let session;
  
  try {
    // Create SNMP session
    session = createSNMPSession(ipAddress, community);
    
    // Get error information
    const errorInfo = await getPrinterErrors(session);
    
    // Get additional status info (page count, device status)
    const additionalInfo = await new Promise((resolve, reject) => {
      const oids = [SNMP_OIDS.PAGE_COUNT, SNMP_OIDS.DEVICE_STATUS];
      
      session.get(oids, (error, varbinds) => {
        if (error) {
          // Don't reject - just return empty info
          return resolve({ pageCount: null, deviceStatus: null });
        }
        
        let pageCount = null;
        let deviceStatus = null;
        
        for (const varbind of varbinds) {
          if (snmp.isVarbindError(varbind)) {
            continue;
          }
          
          if (varbind.oid === SNMP_OIDS.PAGE_COUNT) {
            pageCount = Number.parseInt(varbind.value, 10) || null;
          }
          
          if (varbind.oid === SNMP_OIDS.DEVICE_STATUS) {
            // Device status: 1=unknown, 2=running, 3=warning, 4=testing, 5=down
            const statusCode = Number.parseInt(varbind.value, 10);
            deviceStatus = ['unknown', 'unknown', 'running', 'warning', 'testing', 'down'][statusCode] || 'unknown';
          }
        }
        
        resolve({ pageCount, deviceStatus });
      });
    });
    
    // Determine overall status based on errors
    let status = 'online';
    if (errorInfo.errors.includes('offline')) {
      status = 'offline';
    } else if (errorInfo.errors.includes('jammed') || errorInfo.errors.includes('noPaper') || errorInfo.errors.includes('noToner')) {
      status = 'maintenance';
    } else if (errorInfo.errors.length > 0) {
      status = 'busy';
    }
    
    return {
      status,
      pageCount: additionalInfo.pageCount,
      deviceStatus: additionalInfo.deviceStatus,
      errors: errorInfo.errors,
      alertMessage: errorInfo.alertMessage,
      hasErrors: errorInfo.errors.length > 0,
    };
    
  } catch (error) {
    console.error('❌ SNMP error:', error.message);
    throw new Error('Printer not reachable or SNMP disabled');
  } finally {
    // Always close the session to prevent memory leaks
    if (session) {
      session.close();
    }
  }
}

/**
 * Update printer supply levels based on errors
 * @param {Object} printer - Printer document
 * @param {Array<string>} errors - Array of error names
 */
function updateSupplyLevels(printer, errors) {
  if (!printer.supplies) {
    printer.supplies = {
      inkLevel: { black: 100, cyan: 100, magenta: 100, yellow: 100 },
      paperLevel: 100,
      tonerLevel: 100,
    };
  }
  
  // Update based on detected errors
  if (errors.includes('noPaper')) {
    printer.supplies.paperLevel = 0;
  } else if (errors.includes('lowPaper')) {
    printer.supplies.paperLevel = Math.min(printer.supplies.paperLevel || 100, 20);
  }
  
  if (errors.includes('noToner')) {
    printer.supplies.tonerLevel = 0;
  } else if (errors.includes('lowToner')) {
    printer.supplies.tonerLevel = Math.min(printer.supplies.tonerLevel || 100, 20);
  }
}

/**
 * Create admin notification for printer errors
 * @param {Object} printer - Printer document
 * @param {Array<string>} errors - Array of error names
 * @param {string} alertMessage - Alert message from printer
 */
async function createAdminNotification(printer, errors, alertMessage) {
  try {
    // Get the highest priority error
    const highestPriority = errors.reduce((highest, error) => {
      const priority = ERROR_PRIORITIES[error] || 'medium';
      const priorityLevels = { low: 1, medium: 2, high: 3, urgent: 4 };
      const currentLevel = priorityLevels[priority];
      const highestLevel = priorityLevels[highest];
      return currentLevel > highestLevel ? priority : highest;
    }, 'low');
    
    // Create notification for admin (use a system admin user ID or 'system')
    const notification = await Notification.create({
      clerkUserId: 'system_admin', // This should be replaced with actual admin user IDs
      type: 'maintenance',
      title: `⚠️ Printer Error: ${printer.name}`,
      message: alertMessage || errors.map(e => ERROR_MESSAGES[e]).join('; '),
      priority: highestPriority,
      metadata: {
        printerId: printer._id,
        errorCode: errors.join(','),
        actionRequired: true,
      },
    });
    
    // Emit real-time notification via Socket.IO
    const io = getSocketIO();
    if (io) {
      io.to('admin').emit('printer-error', {
        printerId: printer._id,
        printerName: printer.name,
        errors,
        alertMessage,
        priority: highestPriority,
        timestamp: new Date(),
      });
    }
    
    console.log(`📢 Admin notification created for printer ${printer.name}: ${errors.join(', ')}`);
    
    return notification;
  } catch (error) {
    console.error('❌ Error creating admin notification:', error);
  }
}

/**
 * Monitor a single printer via SNMP
 * @param {Object} printer - Printer document from database
 */
async function monitorPrinter(printer) {
  // Skip virtual printers (like PDF printers)
  if (!printer.systemInfo?.ipAddress || 
      printer.systemInfo.ipAddress === 'localhost' || 
      printer.systemInfo.connectionType === 'Virtual') {
    return;
  }
  
  try {
    const ipAddress = printer.systemInfo.ipAddress;
    console.log(`🔍 Monitoring printer: ${printer.name} (${ipAddress})`);
    
    // Get printer status via SNMP
    const statusInfo = await getPrinterStatus(ipAddress);
    
    // Check if there are new errors
    const previousErrors = printer.lastKnownErrors || [];
    const newErrors = statusInfo.errors.filter(error => !previousErrors.includes(error));
    
    // Update printer in database
    printer.status = statusInfo.status;
    printer.lastChecked = new Date();
    printer.lastKnownErrors = statusInfo.errors;
    
    // Update supply levels based on errors
    updateSupplyLevels(printer, statusInfo.errors);
    
    await printer.save();
    
    // Create admin notification if there are new errors
    if (newErrors.length > 0) {
      await createAdminNotification(printer, statusInfo.errors, statusInfo.alertMessage);
    }
    
    console.log(`✅ Printer ${printer.name} monitored - Status: ${statusInfo.status}, Errors: ${statusInfo.errors.length}`);
    
  } catch (error) {
    console.error(`❌ Error monitoring printer ${printer.name}:`, error.message);
    
    // Mark printer as offline if unreachable
    printer.status = 'offline';
    printer.lastChecked = new Date();
    await printer.save();
  }
}

/**
 * Monitor all printers in the database
 * This function should be called periodically (e.g., every 5 minutes)
 */
async function monitorAllPrinters() {
  try {
    const printers = await Printer.find({ 
      isActive: true,
      'systemInfo.connectionType': { $ne: 'Virtual' }
    });
    
    console.log(`🖨️ Starting SNMP monitoring for ${printers.length} printers...`);
    
    // Monitor all printers in parallel (with error handling per printer)
    await Promise.all(printers.map(printer => monitorPrinter(printer)));
    
    console.log('✅ Printer monitoring cycle completed');
    
  } catch (error) {
    console.error('❌ Error in printer monitoring cycle:', error);
  }
}

module.exports = {
  getPrinterStatus,
  getPrinterErrors,
  monitorPrinter,
  monitorAllPrinters,
  ERROR_MESSAGES,
  ERROR_PRIORITIES,
};
