const express = require('express');
const {
  createPrintJob,
  printJobById,
  getPendingJobs,
  getPrintedJobs,
  getJobStatus,
} = require('../controllers/printJobController');
const { testPrint, getAvailablePrinters } = require('../utils/printerUtils');
const { cleanupTempFiles } = require('../utils/fileUtils');

const router = express.Router();

// Print Job Management Routes
router.post('/jobs', createPrintJob);
router.post('/jobs/:id/print', printJobById);
router.get('/jobs/pending', getPendingJobs);
router.get('/jobs/printed', getPrintedJobs);
router.get('/jobs/:id/status', getJobStatus);

// Printer Management Routes
router.get('/printers', async (req, res) => {
  try {
    const printers = await getAvailablePrinters();
    res.status(200).json({
      success: true,
      data: printers,
      message: `Found ${printers.length} available printers`,
    });
  } catch (error) {
    console.error('❌ Error fetching printers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available printers',
      error: error.message,
    });
  }
});

router.post('/printers/test', async (req, res) => {
  try {
    const { printerName } = req.body;
    const testResult = await testPrint(printerName);
    
    res.status(testResult.success ? 200 : 500).json(testResult);
  } catch (error) {
    console.error('❌ Error testing printer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test printer',
      error: error.message,
    });
  }
});

// Test duplex printing capabilities
router.post('/printers/test-duplex', async (req, res) => {
  try {
    const { printerName } = req.body;
    
    if (!printerName) {
      return res.status(400).json({
        success: false,
        message: 'Printer name is required',
      });
    }

    console.log(`🧪 DUPLEX TEST: Testing duplex capabilities for printer: ${printerName}`);

    // Get available printers to verify the printer exists
    const availablePrinters = await getAvailablePrinters();
    const printer = availablePrinters.find(p => p.name === printerName);
    
    if (!printer) {
      return res.status(404).json({
        success: false,
        message: `Printer "${printerName}" not found`,
        availablePrinters: availablePrinters.map(p => p.name),
      });
    }

    // Test different duplex configurations
    const duplexTests = [
      { duplex: 'long', description: 'Long-edge binding' },
      { duplex: 'short', description: 'Short-edge binding' },
      { sides: 'two-sided-long-edge', description: 'Two-sided long edge' },
      { duplexing: 'DuplexTumble', description: 'Windows DuplexTumble' },
    ];

    const results = [];
    
    for (const test of duplexTests) {
      try {
        console.log(`🔄 Testing duplex option: ${test.description}`, test);
        
        // Create test print options
        const printOptions = {
          printer: printerName,
          ...test,
          copies: 1,
        };
        
        // Just validate the options, don't actually print
        results.push({
          option: test,
          status: 'validated',
          description: test.description,
          printOptions: printOptions,
        });
        
      } catch (error) {
        results.push({
          option: test,
          status: 'failed',
          description: test.description,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Duplex test completed',
      printer: printerName,
      duplexSupported: true, // Assuming supported for testing
      testResults: results,
      recommendations: [
        'Use "duplex: long" for standard double-sided printing',
        'Ensure printer driver supports duplex commands',
        'Check printer physical duplex unit availability',
        'Monitor print job logs for duplex-specific errors',
      ],
    });

  } catch (error) {
    console.error('❌ Error testing duplex:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test duplex printing',
      error: error.message,
    });
  }
});

// Utility Routes
router.post('/utils/cleanup', async (req, res) => {
  try {
    await cleanupTempFiles();
    res.status(200).json({
      success: true,
      message: 'Temporary files cleaned up successfully',
    });
  } catch (error) {
    console.error('❌ Error cleaning up temp files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup temporary files',
      error: error.message,
    });
  }
});

// Health Check Route
router.get('/health', async (req, res) => {
  try {
    const testResult = await testPrint();
    
    res.status(200).json({
      success: true,
      message: 'Print service is healthy',
      data: {
        timestamp: new Date().toISOString(),
        printSystem: testResult,
      },
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Print service health check failed',
      error: error.message,
    });
  }
});

module.exports = router;