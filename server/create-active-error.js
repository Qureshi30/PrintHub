/**
 * Create Active Error for Manual Testing
 * 
 * This script creates an UNRESOLVED error for "Microsoft Print to PDF"
 * so you can test the UI features manually:
 * - See it in Recent System Activity
 * - Try to toggle printer online (should be blocked)
 * - Mark it "In Progress"
 * - Resolve it and see printer auto-recover
 * 
 * Usage: node create-active-error.js
 */

const mongoose = require('mongoose');
const Printer = require('./src/models/Printer');
const PrinterError = require('./src/models/PrinterError');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const TEST_PRINTER_NAME = 'Microsoft Print to PDF';

async function createActiveError() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the printer
    const printer = await Printer.findOne({ name: TEST_PRINTER_NAME });
    
    if (!printer) {
      console.log('❌ Printer not found! Creating it...');
      const newPrinter = new Printer({
        name: TEST_PRINTER_NAME,
        location: 'System Default',
        status: 'online',
        isActive: true,
        capabilities: {
          color: false,
          duplex: false,
          paperSizes: ['A4', 'Letter'],
          maxCopies: 1,
        },
        systemInfo: {
          driverName: 'Microsoft Print To PDF',
          connectionType: 'Virtual',
        },
      });
      await newPrinter.save();
      console.log('✅ Printer created');
    }

    console.log('💥 Creating active error...\n');

    // Get the current printer reference
    const currentPrinter = await Printer.findOne({ name: TEST_PRINTER_NAME });

    // Create an UNRESOLVED error
    const errorData = {
      printerName: TEST_PRINTER_NAME,
      printerId: currentPrinter ? currentPrinter._id : undefined,
      errorType: 'Paper Jam',
      description: 'Paper jam detected in output tray - urgent attention needed',
      status: 'unresolved',
      priority: 'urgent',
      timestamp: new Date(),
      metadata: {
        location: currentPrinter ? currentPrinter.location : 'System Default',
        errorCode: 'JAM_OUTPUT_TRAY',
        affectedJobs: 3,
        detectedBy: 'System Monitor',
      },
    };

    const printerError = await PrinterError.create(errorData);

    // Set printer to offline status when error occurs
    if (currentPrinter) {
      currentPrinter.status = 'offline';
      await currentPrinter.save();
    }

    console.log('✅ Active error created successfully!\n');
    console.log('📊 Error Details:');
    console.log(`   Error ID: ${printerError._id}`);
    console.log(`   Printer: ${printerError.printerName}`);
    console.log(`   Type: ${printerError.errorType}`);
    console.log(`   Status: ${printerError.status}`);
    console.log(`   Priority: ${printerError.priority}`);
    console.log(`   Printer Status: offline`);
    
    console.log('\n🎯 Now you can test in the UI:');
    console.log('   1. Open http://localhost:5173/admin');
    console.log('   2. Check "Recent System Activity" - error should appear');
    console.log('   3. Go to "Printers" page');
    console.log('   4. Try to toggle "Microsoft Print to PDF" online - should be BLOCKED');
    console.log('   5. Go to "Error Logs" page');
    console.log('   6. Click "Start Working" button');
    console.log('   7. Click "Mark Resolved" and add notes');
    console.log('   8. Printer should auto-recover to "online"');
    console.log('   9. Error should disappear from Recent Activity');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed\n');
  }
}

// Run the script
// eslint-disable-next-line unicorn/prefer-top-level-await -- CommonJS module
(async () => {
  await createActiveError();
})();
