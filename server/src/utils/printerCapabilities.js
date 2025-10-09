const printer = require('pdf-to-printer');

/**
 * Detect real printer capabilities from system printers
 */
async function detectSystemPrinterCapabilities() {
  try {
    const systemPrinters = await printer.getPrinters();
    const capabilities = {};
    
    for (const sysPrinter of systemPrinters) {
      const capability = detectCapabilitiesFromName(sysPrinter.name);
      capabilities[sysPrinter.name] = {
        name: sysPrinter.name,
        status: sysPrinter.status || 'unknown',
        isDefault: sysPrinter.isDefault || false,
        colorSupport: capability.colorSupport,
        duplexSupport: capability.duplexSupport,
        supportedPaperTypes: capability.supportedPaperTypes,
        detectionMethod: capability.detectionMethod
      };
    }
    
    return capabilities;
  } catch (error) {
    console.error('❌ Error detecting system printer capabilities:', error);
    return {};
  }
}

/**
 * Detect printer capabilities based on printer name and known models
 */
function detectCapabilitiesFromName(printerName) {
  const name = printerName.toLowerCase();
  
  // HP LaserJet Detection
  if (name.includes('hp') && name.includes('laserjet')) {
    // HP LaserJet Pro M201-M202 specifically does NOT support duplex
    if (name.includes('m201') || name.includes('m202')) {
      return {
        colorSupport: false,
        duplexSupport: false, // M201-M202 are single-sided only
        supportedPaperTypes: ['A4', 'Letter', 'Legal'],
        detectionMethod: 'HP LaserJet M201/M202 specific - no duplex'
      };
    }
    
    // HP LaserJet MFP models - check for duplex capability
    if (name.includes('mfp')) {
      return {
        colorSupport: name.includes('color'),
        duplexSupport: false, // Most entry-level MFP don't have duplex
        supportedPaperTypes: ['A4', 'Letter', 'Legal'],
        detectionMethod: 'HP LaserJet MFP - typically no duplex'
      };
    }
    
    // Other HP LaserJet models
    return {
      colorSupport: name.includes('color') || name.includes('colour'),
      duplexSupport: name.includes('duplex') || name.includes('enterprise'),
      supportedPaperTypes: ['A4', 'Letter', 'Legal'],
      detectionMethod: 'HP LaserJet general detection'
    };
  }
  
  // Microsoft Print to PDF
  if (name.includes('microsoft') && name.includes('pdf')) {
    return {
      colorSupport: true,
      duplexSupport: false, // PDF doesn't support duplex
      supportedPaperTypes: ['A4', 'A3', 'Letter', 'Legal'],
      detectionMethod: 'Virtual PDF printer'
    };
  }
  
  // OneNote
  if (name.includes('onenote')) {
    return {
      colorSupport: true,
      duplexSupport: false,
      supportedPaperTypes: ['A4', 'Letter'],
      detectionMethod: 'OneNote virtual printer'
    };
  }
  
  // Fax
  if (name.includes('fax')) {
    return {
      colorSupport: false,
      duplexSupport: false,
      supportedPaperTypes: ['A4', 'Letter'],
      detectionMethod: 'Fax printer'
    };
  }
  
  // Generic/Unknown printer - conservative defaults
  return {
    colorSupport: name.includes('color') || name.includes('colour'),
    duplexSupport: false, // Default to no duplex for unknown printers
    supportedPaperTypes: ['A4', 'Letter'],
    detectionMethod: 'Generic detection - conservative defaults'
  };
}

/**
 * Get real capabilities for a specific printer by name
 */
async function getRealPrinterCapabilities(printerName) {
  try {
    const systemCapabilities = await detectSystemPrinterCapabilities();
    
    // Try exact match first
    if (systemCapabilities[printerName]) {
      return systemCapabilities[printerName];
    }
    
    // Try partial match
    for (const [systemName, capabilities] of Object.entries(systemCapabilities)) {
      if (systemName.toLowerCase().includes(printerName.toLowerCase()) ||
          printerName.toLowerCase().includes(systemName.toLowerCase())) {
        return capabilities;
      }
    }
    
    // Fallback to name-based detection
    const capability = detectCapabilitiesFromName(printerName);
    return {
      name: printerName,
      status: 'unknown',
      isDefault: false,
      ...capability
    };
    
  } catch (error) {
    console.error(`❌ Error getting capabilities for ${printerName}:`, error);
    // Return conservative defaults
    return {
      name: printerName,
      status: 'unknown',
      colorSupport: false,
      duplexSupport: false,
      supportedPaperTypes: ['A4', 'Letter'],
      detectionMethod: 'Error fallback - conservative defaults'
    };
  }
}

module.exports = {
  detectSystemPrinterCapabilities,
  detectCapabilitiesFromName,
  getRealPrinterCapabilities
};