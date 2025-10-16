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
 * We're specifically using HP LaserJet Pro M201-M202 PCL 6
 * @param {string|ObjectId} printerId - Frontend printer ID or ObjectId
 * @returns {Promise<string>} - Actual printer name
 */
const getPrinterName = async (printerId) => {
  console.log(`🔍 Getting printer name for ID: ${printerId}`);
  
  try {
    const availablePrinters = await getAvailablePrinters();
    console.log(`🖨️ Found ${availablePrinters.length} available printers`);
    
    // We're specifically using HP LaserJet Pro M201-M202 PCL 6
    const targetPrinterName = 'HP LaserJet Pro M201-M202 PCL 6';
    const targetPrinter = availablePrinters.find(p => p.name === targetPrinterName);
    
    if (targetPrinter) {
      console.log(`🖨️ Found HP LaserJet: ${targetPrinter.name}`);
      return targetPrinter.name;
    }
    
    // Fallback to any HP LaserJet if the exact one isn't found
    const hpPrinter = availablePrinters.find(p => 
      p.name.toLowerCase().includes('hp laserjet') && 
      p.name.toLowerCase().includes('m201')
    );
    
    if (hpPrinter) {
      console.log(`�️ Found HP LaserJet fallback: ${hpPrinter.name}`);
      return hpPrinter.name;
    }
    
    // Last resort - use default printer
    console.log(`⚠️ HP LaserJet not found, using default printer`);
    return await getDefaultPrinter();
  } catch (error) {
    console.error('❌ Failed to get printer name:', error);
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