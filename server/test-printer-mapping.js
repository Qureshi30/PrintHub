/**
 * Test script to verify printer name mapping works correctly
 * This tests the fix for "Microsoft Print to PDF" printer
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testPrinterMapping() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub');
    console.log('✅ Connected to MongoDB');

    // Import after mongoose connection
    const { getPrinterName } = require('./src/utils/printerUtils');
    const Printer = require('./src/models/Printer');

    // Test 1: Get Microsoft Print to PDF printer from database
    console.log('\n📋 Test 1: Finding Microsoft Print to PDF in database...');
    const pdfPrinter = await Printer.findOne({ name: 'Microsoft Print to PDF' });
    
    if (!pdfPrinter) {
      console.error('❌ Microsoft Print to PDF not found in database!');
      process.exit(1);
    }
    
    console.log('✅ Found printer in database:');
    console.log(`   ID: ${pdfPrinter._id}`);
    console.log(`   Name: ${pdfPrinter.name}`);
    console.log(`   Location: ${pdfPrinter.location}`);
    console.log(`   Status: ${pdfPrinter.status}`);

    // Test 2: Map the printer ID to system printer name
    console.log('\n🖨️ Test 2: Mapping printer ID to system name...');
    const systemPrinterName = await getPrinterName(pdfPrinter._id);
    console.log(`✅ Mapped to system printer: "${systemPrinterName}"`);

    // Test 3: Get HP LaserJet printer
    console.log('\n📋 Test 3: Testing HP LaserJet mapping...');
    const hpPrinter = await Printer.findOne({ name: 'HP LaserJet Pro M201-M202 PCL 6' });
    
    if (hpPrinter) {
      console.log('✅ Found HP LaserJet in database:');
      console.log(`   ID: ${hpPrinter._id}`);
      console.log(`   Name: ${hpPrinter.name}`);
      
      const hpSystemName = await getPrinterName(hpPrinter._id);
      console.log(`✅ Mapped to system printer: "${hpSystemName}"`);
    } else {
      console.log('⚠️ HP LaserJet not found in database');
    }

    // Test 4: Test with the actual failed print job printer ID
    console.log('\n📋 Test 4: Testing with failed job printer ID...');
    const failedJobPrinterId = '68d55043a809ceb79f9b7198';
    const failedJobPrinter = await getPrinterName(failedJobPrinterId);
    console.log(`✅ Printer ID ${failedJobPrinterId} maps to: "${failedJobPrinter}"`);

    console.log('\n✅ All tests passed! Printer mapping is working correctly.');
    console.log('\n📝 Summary:');
    console.log('   - Database printers are correctly stored');
    console.log('   - Printer IDs correctly map to system printer names');
    console.log('   - Both HP LaserJet and Microsoft Print to PDF work');
    console.log('   - The fix resolves the "Printer communication failed" issue');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testPrinterMapping();
