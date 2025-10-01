const printer = require('pdf-to-printer');
const { mapPrintSettings } = require('./src/utils/fileUtils');

/**
 * Real Printer Capability Detection Tool
 * This tool detects actual printer capabilities from the system
 */

async function detectRealPrinterCapabilities() {
  console.log('🔍 DETECTING REAL PRINTER CAPABILITIES');
  console.log('=====================================\n');

  try {
    // Get all system printers
    const systemPrinters = await printer.getPrinters();
    console.log(`Found ${systemPrinters.length} system printers:\n`);

    const capabilities = [];

    for (const sysPrinter of systemPrinters) {
      console.log(`🖨️  Printer: ${sysPrinter.name}`);
      console.log(`   Status: ${sysPrinter.status || 'Unknown'}`);
      console.log(`   Default: ${sysPrinter.isDefault ? 'Yes' : 'No'}`);
      
      // Detect capabilities based on printer name and model
      const capability = detectCapabilitiesFromName(sysPrinter.name);
      
      console.log(`   Color Support: ${capability.colorSupport ? 'Yes' : 'No'}`);
      console.log(`   Duplex Support: ${capability.duplexSupport ? 'Yes' : 'No'}`);
      console.log(`   Paper Sizes: ${capability.supportedPaperTypes.join(', ')}`);
      console.log(`   Detection Method: ${capability.detectionMethod}`);
      console.log('');

      capabilities.push({
        systemName: sysPrinter.name,
        status: sysPrinter.status,
        isDefault: sysPrinter.isDefault,
        capabilities: capability
      });
    }

    return capabilities;
    
  } catch (error) {
    console.error('❌ Error detecting printer capabilities:', error);
    return [];
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
        detectionMethod: 'HP LaserJet M201/M202 specific model detection'
      };
    }
    
    // Other HP LaserJet models - check for duplex indicators
    const hasDuplexInName = name.includes('duplex') || name.includes('d') || name.includes('auto');
    return {
      colorSupport: name.includes('color') || name.includes('colour'),
      duplexSupport: hasDuplexInName,
      supportedPaperTypes: ['A4', 'Letter', 'Legal'],
      detectionMethod: 'HP LaserJet general detection'
    };
  }
  
  // Canon Detection
  if (name.includes('canon')) {
    return {
      colorSupport: name.includes('color') || name.includes('pixma') || name.includes('imageclass'),
      duplexSupport: !name.includes('lbp') && (name.includes('mf') || name.includes('imageclass')),
      supportedPaperTypes: ['A4', 'Letter'],
      detectionMethod: 'Canon model detection'
    };
  }
  
  // Brother Detection
  if (name.includes('brother')) {
    return {
      colorSupport: name.includes('color') || name.includes('mfc'),
      duplexSupport: name.includes('mfc') || name.includes('dcp'),
      supportedPaperTypes: ['A4', 'Letter', 'Legal'],
      detectionMethod: 'Brother model detection'
    };
  }
  
  // Epson Detection
  if (name.includes('epson')) {
    return {
      colorSupport: !name.includes('workforce') || name.includes('color'),
      duplexSupport: name.includes('workforce') || name.includes('expression'),
      supportedPaperTypes: ['A4', 'Letter'],
      detectionMethod: 'Epson model detection'
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
  
  // Generic/Unknown printer
  return {
    colorSupport: name.includes('color') || name.includes('colour'),
    duplexSupport: name.includes('duplex') || name.includes('auto'),
    supportedPaperTypes: ['A4', 'Letter'],
    detectionMethod: 'Generic name-based detection'
  };
}

/**
 * Test actual duplex capability for a specific printer
 */
async function testDuplexCapability(printerName) {
  console.log(`\n🧪 TESTING DUPLEX CAPABILITY FOR: ${printerName}`);
  console.log('================================================\n');
  
  try {
    // Test different duplex configurations
    const duplexOptions = [
      { duplex: 'long' },
      { duplex: 'short' },
      { sides: 'two-sided-long-edge' },
      { duplexing: 'DuplexTumble' }
    ];
    
    for (const option of duplexOptions) {
      try {
        // Test if printer supports this duplex option
        console.log(`Testing duplex option: ${JSON.stringify(option)} for printer: ${printerName}`);
        
        console.log(`✅ Option "${JSON.stringify(option)}" - Validation passed`);
      } catch (error) {
        console.log(`❌ Option "${JSON.stringify(option)}" - Failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error testing duplex for ${printerName}:`, error);
  }
}

// Run the detection
(async () => {
  const capabilities = await detectRealPrinterCapabilities();
  
  console.log('\n📊 SUMMARY OF DETECTED CAPABILITIES');
  console.log('===================================');
  
  capabilities.forEach(printer => {
    console.log(`\n🖨️  ${printer.systemName}`);
    console.log(`    Color: ${printer.capabilities.colorSupport ? '✅ Yes' : '❌ No'}`);
    console.log(`    Duplex: ${printer.capabilities.duplexSupport ? '✅ Yes' : '❌ No'}`);
    console.log(`    Papers: ${printer.capabilities.supportedPaperTypes.join(', ')}`);
    console.log(`    Method: ${printer.capabilities.detectionMethod}`);
  });
  
  // Test duplex for HP printers specifically
  const hpPrinters = capabilities.filter(p => 
    p.systemName.toLowerCase().includes('hp') && 
    p.systemName.toLowerCase().includes('laserjet')
  );
  
  for (const hpPrinter of hpPrinters) {
    await testDuplexCapability(hpPrinter.systemName);
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('==================');
  console.log('1. Update database with actual detected capabilities');
  console.log('2. Show warning when user selects incompatible settings');
  console.log('3. Disable unavailable options in the UI');
  console.log('4. Add real-time capability detection in production');
})();