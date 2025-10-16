const printer = require('pdf-to-printer');
const os = require('os');
const { mapPrintSettings } = require('./fileUtils');

/**
 * Get list of available printers on the system
 * @returns {Promise<Array>} - Array of printer objects
 */
const getAvailablePrinters = async () => {
  try {
    const printers = await printer.getPrinters();
    console.log(`🖨️ Found ${printers.length} available printers`);
    return printers;
  } catch (error) {
    console.error('❌ Failed to get printers:', error.message);
    throw new Error(`Failed to get available printers: ${error.message}`);
  }
};

/**
 * Get the default printer name
 * @returns {Promise<string>} - Default printer name
 */
const getDefaultPrinter = async () => {
  try {
    const printers = await getAvailablePrinters();
    
    // Prefer HP LaserJet if available
    const hpPrinter = printers.find(p => 
      p.name.toLowerCase().includes('hp laserjet') ||
      p.name.toLowerCase().includes('m201') ||
      p.name.toLowerCase().includes('m202')
    );
    
    if (hpPrinter) {
      console.log(`🖨️ Found HP LaserJet: ${hpPrinter.name}`);
      return hpPrinter.name;
    }
    
    const defaultPrinter = printers.find(p => p.isDefault) || printers[0];
    
    if (!defaultPrinter) {
      throw new Error('No printers available');
    }
    
    console.log(`🖨️ Default printer: ${defaultPrinter.name}`);
    return defaultPrinter.name;
  } catch (error) {
    console.error('❌ Failed to get default printer:', error.message);
    throw error;
  }
};

/**
 * Map printerId from frontend to actual printer name
 * Queries the database to get the printer name, then validates it exists on the system
 * @param {string|ObjectId} printerId - Frontend printer ID or ObjectId
 * @returns {Promise<string>} - Actual printer name
 */
const getPrinterName = async (printerId) => {
  console.log(`🔍 Getting printer name for ID: ${printerId}`);
  
  try {
    // Import Printer model dynamically to avoid circular dependencies
    const Printer = require('../models/Printer');
    
    // Query database for printer name
    const printerDoc = await Printer.findById(printerId);
    
    if (!printerDoc) {
      console.error(`❌ Printer not found in database with ID: ${printerId}`);
      throw new Error(`Printer not found in database with ID: ${printerId}`);
    }
    
    const dbPrinterName = printerDoc.name;
    console.log(`📋 Database printer name: ${dbPrinterName}`);
    
    // Get available system printers
    const availablePrinters = await getAvailablePrinters();
    console.log(`🖨️ Found ${availablePrinters.length} available system printers`);
    
    // Try to find exact match first
    let targetPrinter = availablePrinters.find(p => p.name === dbPrinterName);
    
    if (targetPrinter) {
      console.log(`✅ Found exact match: ${targetPrinter.name}`);
      return targetPrinter.name;
    }
    
    // Try case-insensitive match
    targetPrinter = availablePrinters.find(p => 
      p.name.toLowerCase() === dbPrinterName.toLowerCase()
    );
    
    if (targetPrinter) {
      console.log(`✅ Found case-insensitive match: ${targetPrinter.name}`);
      return targetPrinter.name;
    }
    
    // Try partial match for virtual printers (e.g., "Microsoft Print to PDF")
    if (dbPrinterName.toLowerCase().includes('pdf') || 
        dbPrinterName.toLowerCase().includes('microsoft')) {
      targetPrinter = availablePrinters.find(p => 
        p.name.toLowerCase().includes('microsoft') && 
        p.name.toLowerCase().includes('pdf')
      );
      
      if (targetPrinter) {
        console.log(`✅ Found PDF printer: ${targetPrinter.name}`);
        return targetPrinter.name;
      }
    }
    
    // List available printers for debugging
    console.error(`❌ Printer "${dbPrinterName}" not found on system`);
    console.error(`📋 Available printers:`);
    for (const p of availablePrinters) {
      console.error(`   - ${p.name}`);
    }
    
    throw new Error(`Printer "${dbPrinterName}" not found on system. Please check printer installation.`);
    
  } catch (error) {
    console.error('❌ Failed to get printer name:', error.message);
    throw error;
  }
};

/**
 * DEPRECATED: Old hardcoded logic - keeping for reference
 * This function was hardcoded to only look for HP LaserJet, ignoring the actual printer in the database
 */
const _oldGetPrinterName = async (printerId) => {
  try {
    const availablePrinters = await getAvailablePrinters();
    
    // This was the problem - always looking for HP LaserJet regardless of what printer was requested
    const targetPrinterName = 'HP LaserJet Pro M201-M202 PCL 6';
    const targetPrinter = availablePrinters.find(p => p.name === targetPrinterName);
    
    if (targetPrinter) {
      return targetPrinter.name;
    }
    
    const hpPrinter = availablePrinters.find(p => 
      p.name.toLowerCase().includes('hp laserjet') && 
      p.name.toLowerCase().includes('m201')
    );
    
    if (hpPrinter) {
      return hpPrinter.name;
    }
    
    return await getDefaultPrinter();
  } catch (error) {
    return await getDefaultPrinter();
  }
};

/**
 * Print a file using pdf-to-printer
 * @param {string} filePath - Local path to file
 * @param {Object} printSettings - PrintJob settings object
 * @param {string} printerName - Optional specific printer name
 * @returns {Promise<Object>} - Print result
 */
const printFile = async (filePath, printSettings = {}, printerName = null, printerId = null) => {
  const startTime = Date.now();
  
  try {
    console.log(`🖨️ Starting print job for: ${filePath}`);
    console.log(`🔧 Print settings received:`, printSettings);
    
    // Get printer name - use mapping if printerId provided, otherwise use printerName or default
    let targetPrinter;
    if (printerId) {
      targetPrinter = await getPrinterName(printerId);
    } else {
      targetPrinter = printerName || await getDefaultPrinter();
    }
    console.log(`🖨️ Using printer: ${targetPrinter}`);
    
    // Validate duplex capability for physical printers
    if (printSettings.duplex && !targetPrinter.toLowerCase().includes('pdf')) {
      console.log(`🔄 DUPLEX CHECK: Validating duplex support for printer: ${targetPrinter}`);
      // Most HP LaserJet Pro models support duplex, but warn if it's not a known model
      if (!targetPrinter.toLowerCase().includes('laserjet') && 
          !targetPrinter.toLowerCase().includes('m201') && 
          !targetPrinter.toLowerCase().includes('m202')) {
        console.warn(`⚠️ DUPLEX WARNING: Printer "${targetPrinter}" may not support duplex printing`);
      }
    }
    
    // Map print settings to pdf-to-printer options
    const printOptions = mapPrintSettings(printSettings);
    printOptions.printer = targetPrinter;
    
    // Verify printer exists
    const availablePrinters = await getAvailablePrinters();
    const printerExists = availablePrinters.some(p => p.name === targetPrinter);
    
    if (!printerExists) {
      throw new Error(`Printer "${targetPrinter}" not found`);
    }
    
    console.log(`🖨️ Print options:`, printOptions);
    
      // Execute print command
      console.log(`📤 Sending print command to printer: ${targetPrinter}`);
      await printer.print(filePath, printOptions);
      
      const endTime = Date.now();
      const processingTime = Math.round((endTime - startTime) / 1000); // seconds
      
      console.log(`✅ Print command sent successfully to printer in ${processingTime}s`);
      console.log(`📋 Job sent to printer queue - printer should process it now`);
      
      return {
        success: true,
        printerName: targetPrinter,
        processingTimeSeconds: processingTime,
        printOptions: printOptions,
        message: 'Print command sent to printer successfully',
      };  } catch (error) {
    const endTime = Date.now();
    const processingTime = Math.round((endTime - startTime) / 1000);
    
    console.error(`❌ Print job failed after ${processingTime}s:`, error.message);
    
    return {
      success: false,
      error: error.message,
      processingTimeSeconds: processingTime,
      message: `Print job failed: ${error.message}`,
    };
  }
};

/**
 * Test print functionality with a simple text
 * @param {string} printerName - Optional specific printer name
 * @returns {Promise<Object>} - Test result
 */
const testPrint = async (printerName = null) => {
  try {
    console.log('🧪 Testing print functionality...');
    
    const printers = await getAvailablePrinters();
    const targetPrinter = printerName || await getDefaultPrinter();
    
    return {
      success: true,
      availablePrinters: printers.map(p => ({
        name: p.name,
        isDefault: p.isDefault || false,
        status: p.status || 'unknown',
      })),
      defaultPrinter: targetPrinter,
      system: {
        platform: os.platform(),
        hostname: os.hostname(),
      },
      message: 'Print system is ready',
    };
    
  } catch (error) {
    console.error('❌ Print test failed:', error.message);
    return {
      success: false,
      error: error.message,
      message: `Print system test failed: ${error.message}`,
    };
  }
};

module.exports = {
  getAvailablePrinters,
  getDefaultPrinter,
  getPrinterName,
  printFile,
  testPrint,
};