/**
 * Test script for printer job monitoring
 * Tests cross-platform OS-level printer queue monitoring
 */

const printerJobMonitor = require('./src/services/printerJobMonitor');
const os = require('node:os');

async function testPrinterJobMonitor() {
  console.log('═══════════════════════════════════════════════');
  console.log('🧪 Testing Printer Job Monitor');
  console.log('═══════════════════════════════════════════════');
  console.log(`📊 Platform: ${os.platform()}`);
  console.log('');

  // Test printer name - adjust based on your system
  const testPrinters = [
    'Microsoft Print to PDF',
    'HP LaserJet Pro M201-M202 PCL 6',
    'Microsoft XPS Document Writer'
  ];

  for (const printerName of testPrinters) {
    console.log(`\n📋 Testing printer: ${printerName}`);
    console.log('─────────────────────────────────────────────');

    try {
      // Test 1: Get current job count
      console.log('Test 1: Getting current job count...');
      const jobCount = await printerJobMonitor.getPrinterJobCount(printerName);
      console.log(`✅ Job count: ${jobCount}`);

      // Test 2: Check if printer is busy
      console.log('\nTest 2: Checking if printer is busy...');
      const isBusy = await printerJobMonitor.isPrinterBusy(printerName);
      console.log(`✅ Is busy: ${isBusy}`);

      // Test 3: Get detailed queue status
      console.log('\nTest 3: Getting detailed queue status...');
      const status = await printerJobMonitor.getPrinterQueueStatus(printerName);
      console.log(`✅ Queue status:`, JSON.stringify(status, null, 2));

      // Test 4: Wait for printer to finish (with short timeout for testing)
      if (jobCount > 0) {
        console.log('\nTest 4: Waiting for printer to finish (max 30s)...');
        const result = await printerJobMonitor.waitForPrinterToFinish(
          printerName,
          30000, // 30 seconds max
          2000   // Check every 2 seconds
        );
        console.log(`✅ Wait result:`, JSON.stringify(result, null, 2));
      } else {
        console.log('\nTest 4: Skipped (no jobs in queue)');
      }

      console.log(`\n✅ All tests passed for ${printerName}`);

    } catch (error) {
      console.error(`❌ Error testing ${printerName}:`, error.message);
      console.error('Stack:', error.stack);
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Testing complete!');
  console.log('═══════════════════════════════════════════════');
}

// Run the test
testPrinterJobMonitor()
  .then(() => {
    console.log('\n✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
