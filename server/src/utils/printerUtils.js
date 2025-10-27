const printer = require('pdf-to-printer');
const os = require('node:os');
const { mapPrintSettings } = require('./fileUtils');

// Cache for printer list to avoid hammering the pdf-to-printer library
let printerCache = null;
let printerCacheTimestamp = 0;
const CACHE_TTL_MS = 5000; // Cache for 5 seconds
let printerFetchInProgress = false;
let printerFetchPromise = null;

/**
 * Get list of available printers on the system (with caching)
 * @returns {Promise<Array>} - Array of printer objects
 */
const getAvailablePrinters = async () => {
  // Check cache first
  const now = Date.now();
  if (printerCache && (now - printerCacheTimestamp) < CACHE_TTL_MS) {
    console.log(`🖨️ Returning cached printer list (${printerCache.length} printers)`);
    return printerCache;
  }

  // If a fetch is already in progress, wait for it
  if (printerFetchInProgress && printerFetchPromise) {
    console.log(`⏳ Waiting for in-progress printer fetch...`);
    return await printerFetchPromise;
  }

  // Start a new fetch
  printerFetchInProgress = true;
  printerFetchPromise = (async () => {
    try {
      console.log(`🔍 Fetching printer list from system...`);
      const printers = await printer.getPrinters();
      
      // Ensure printers is an array
      if (!Array.isArray(printers)) {
        console.warn('⚠️ getPrinters() did not return an array, returning empty array');
        printerCache = [];
        printerCacheTimestamp = now;
        return [];
      }
      
      // Filter out any invalid printer objects that don't have a name
      // Some printer drivers can cause undefined/null entries or malformed objects
      const validPrinters = printers.filter(p => {
        try {
          return p && typeof p === 'object' && typeof p.name === 'string' && p.name.trim() !== '';
        } catch (err) {
          // Skip any printers that cause errors when accessing properties
          return false;
        }
      });
      
      if (validPrinters.length === 0) {
        console.warn('⚠️ No valid printers found on system');
      } else {
        console.log(`🖨️ Found ${validPrinters.length} available printers (${printers.length - validPrinters.length} invalid)`);
      }
      
      // Update cache
      printerCache = validPrinters;
      printerCacheTimestamp = now;
      
      return validPrinters;
    } catch (error) {
      // pdf-to-printer library can crash when reading malformed printer drivers
      console.error('❌ Failed to get printers:', error.message);
      console.error('❌ This may be due to corrupted printer drivers in Windows registry');
      console.error('❌ Try reinstalling the printer driver or removing unused printers');
      
      // Return empty array instead of throwing to allow the app to continue
      // This way other printers can still work even if one driver is broken
      printerCache = [];
      printerCacheTimestamp = now;
      return [];
    } finally {
      printerFetchInProgress = false;
      printerFetchPromise = null;
    }
  })();

  return await printerFetchPromise;
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
      p.name && (
        p.name.toLowerCase().includes('hp laserjet') ||
        p.name.toLowerCase().includes('m201') ||
        p.name.toLowerCase().includes('m202')
      )
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
    
    // Check if we got any printers at all
    if (!availablePrinters || availablePrinters.length === 0) {
      const errorMsg = 'No printers available on system. Printer drivers may be corrupted or printer service not running.';
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Try to find exact match first
    let targetPrinter = availablePrinters.find(p => p.name && p.name === dbPrinterName);
    
    if (targetPrinter) {
      console.log(`✅ Found exact match: ${targetPrinter.name}`);
      return targetPrinter.name;
    }
    
    // Try case-insensitive match
    targetPrinter = availablePrinters.find(p => 
      p.name && p.name.toLowerCase() === dbPrinterName.toLowerCase()
    );
    
    if (targetPrinter) {
      console.log(`✅ Found case-insensitive match: ${targetPrinter.name}`);
      return targetPrinter.name;
    }
    
    // Try partial match for virtual printers (e.g., "Microsoft Print to PDF")
    if (dbPrinterName.toLowerCase().includes('pdf') || 
        dbPrinterName.toLowerCase().includes('microsoft')) {
      targetPrinter = availablePrinters.find(p => 
        p.name && 
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
    const targetPrinter = availablePrinters.find(p => p.name && p.name === targetPrinterName);
    
    if (targetPrinter) {
      return targetPrinter.name;
    }
    
    const hpPrinter = availablePrinters.find(p => 
      p.name &&
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

/**
 * Print a blank separator page
 * Creates a temporary blank PDF and sends it to the printer
 * @param {string} printerName - Name of the printer
 * @param {string} jobId - ID of the job that just completed (for logging)
 * @returns {Promise<Object>} - Print result
 */
const printBlankPage = async (printerName, jobId = 'unknown') => {
  const startTime = Date.now();
  const fs = require('node:fs').promises;
  const path = require('node:path');
  const os = require('node:os');
  
  let tempFilePath = null;
  
  try {
    console.log(`📄 Preparing blank separator page after job ${jobId}`);
    console.log(`🖨️ Target printer: ${printerName}`);
    
    // Create a blank PDF using PDFKit
    const PDFDocument = require('pdfkit');
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `blank_separator_${Date.now()}.pdf`);
    
    // Create blank PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
    });
    
    const writeStream = require('node:fs').createWriteStream(tempFilePath);
    doc.pipe(writeStream);
    
    // Add a single blank page (with optional tiny watermark for tracking)
    doc.fontSize(6)
       .fillColor('#f0f0f0')
       .text('Print Separator', 10, 10, { opacity: 0.1 });
    
    doc.end();
    
    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    console.log(`✅ Blank PDF created: ${tempFilePath}`);
    
    // Print the blank page
    const printOptions = {
      printer: printerName,
      silent: true, // Don't show print dialog
    };
    
    console.log(`📤 Sending blank separator to printer: ${printerName}`);
    await printer.print(tempFilePath, printOptions);
    
    const endTime = Date.now();
    const processingTime = Math.round((endTime - startTime) / 1000);
    
    console.log(`✅ Blank page separator sent successfully in ${processingTime}s`);
    console.log(`📋 Inserted blank page separator after job ${jobId}`);
    
    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
      console.log(`🗑️ Cleaned up blank page temp file`);
    } catch (cleanupError) {
      console.warn(`⚠️ Failed to cleanup blank page temp file:`, cleanupError.message);
    }
    
    return {
      success: true,
      printerName,
      processingTimeSeconds: processingTime,
      message: `Inserted blank page separator after job ${jobId}`,
    };
    
  } catch (error) {
    const endTime = Date.now();
    const processingTime = Math.round((endTime - startTime) / 1000);
    
    console.error(`❌ Failed to print blank separator after ${processingTime}s:`, error.message);
    
    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.debug('Temp file cleanup failed:', cleanupError.message);
      }
    }
    
    return {
      success: false,
      error: error.message,
      processingTimeSeconds: processingTime,
      message: `Failed to print blank separator: ${error.message}`,
    };
  }
};

module.exports = {
  getAvailablePrinters,
  getDefaultPrinter,
  getPrinterName,
  printFile,
  printBlankPage,
  testPrint,
};