const QueueManager = require('../services/queueManager');
const PrintJob = require('../models/PrintJob');

class QueueProcessor {
  processingPrinters = new Map(); // Track which printers are currently processing
  processingInterval = null;
  intervalMs = 5000; // Check every 5 seconds
  isRunning = false;

  /**
   * Start the queue processor
   */
  start() {
    if (this.processingInterval) {
      console.log('🟡 Queue processor is already running');
      return;
    }

    console.log('🚀 Starting print queue processor with CONCURRENT PRINTING...');
    console.log('🖨️ Multiple printers can process jobs simultaneously');
    console.log(`⏱️ Checking for new jobs every ${this.intervalMs}ms (${this.intervalMs/1000} seconds)`);
    this.isRunning = true;
    
    this.processingInterval = setInterval(() => {
      this.processNextJobs();
    }, this.intervalMs);

    // Process immediately on start
    console.log('🔍 Checking for pending jobs immediately...');
    this.processNextJobs();
  }

  /**
   * Stop the queue processor
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.isRunning = false;
      console.log('🛑 Print queue processor stopped');
    }
  }

  /**
   * Process jobs for all available printers concurrently
   */
  async processNextJobs() {
    try {
      // Get all pending jobs grouped by printer
      const nextJobs = await QueueManager.getNextJobsPerPrinter();
      
      if (!nextJobs || nextJobs.length === 0) {
        return; // No jobs to process
      }

      console.log(`\n🔄 Found ${nextJobs.length} printer(s) with pending jobs`);

      // Process each printer's job concurrently
      const processingPromises = nextJobs.map(async (queueItem) => {
        const printerId = queueItem.printJobId.printerId.toString();
        
        // Check if this printer is already processing a job
        if (this.processingPrinters.has(printerId)) {
          console.log(`⏳ Printer ${queueItem.printJobId.printerId} already processing, skipping...`);
          return;
        }

        // Mark printer as processing with timestamp
        this.processingPrinters.set(printerId, {
          jobId: queueItem.printJobId._id,
          startTime: Date.now()
        });

        try {
          await this.processJob(queueItem);
        } finally {
          // Wait for OS to confirm printer finished before releasing lock
          const printerJobMonitor = require('./printerJobMonitor');
          const { getPrinterName } = require('../utils/printerUtils');
          
          try {
            const printerName = await getPrinterName(queueItem.printJobId.printerId);
            console.log(`🔍 Checking if printer "${printerName}" has finished all jobs...`);
            
            // Wait for printer queue to be empty (max 5 minutes, check every 2 seconds)
            const monitorResult = await printerJobMonitor.waitForPrinterToFinish(
              printerName,
              300000, // 5 minutes max
              2000    // Check every 2 seconds
            );
            
            if (monitorResult.success) {
              console.log(`✅ Printer "${printerName}" confirmed finished (${monitorResult.elapsedTimeMs / 1000}s)`);
            } else {
              console.warn(`⚠️ Printer monitoring timeout for "${printerName}" - releasing anyway`);
            }
          } catch (err) {
            console.warn('⚠️ Error monitoring printer queue:', err.message);
            console.warn('⚠️ Releasing printer lock anyway to prevent deadlock');
          }
          
          // Release printer
          this.processingPrinters.delete(printerId);
          console.log(`✅ Printer ${printerId} released and ready for next job`);
        }
      });

      // Wait for all printers to finish processing their current jobs
      await Promise.allSettled(processingPromises);

    } catch (error) {
      console.error('❌ Error in processNextJobs:', error);
    }
  }

  /**
   * Process a single job
   */
  async processJob(queueItem) {
    const nextJob = queueItem;

    try {
      console.log('═══════════════════════════════════════════════');
      console.log(`🎯 MAIN PROCESSOR: Starting job ${nextJob.printJobId._id}`);
      console.log(`📄 File: ${nextJob.printJobId.file.originalName}`);
      console.log(`📊 Position: ${nextJob.position}`);
      console.log(`👤 User: ${nextJob.printJobId.userName || nextJob.printJobId.clerkUserId}`);
      console.log('═══════════════════════════════════════════════');

      // Mark job as in-progress (with retry logic for write conflicts)
      try {
        await QueueManager.markInProgress(nextJob._id);
      } catch (markError) {
        // If write conflict, wait a bit and retry once
        if (markError.message.includes('Write conflict')) {
          console.log('⚠️ Write conflict detected, retrying after 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          await QueueManager.markInProgress(nextJob._id);
        } else {
          throw markError;
        }
      }

      // Check printer health before sending
      const { checkPrinterHealth } = require('./printErrorHandler');
      const healthCheck = await checkPrinterHealth(nextJob.printJobId.printerId);
      
      if (!healthCheck.canPrint) {
        console.error(`🚫 Printer health check failed: ${healthCheck.error}`);
        const { handlePrintError } = require('./printErrorHandler');
        await handlePrintError(nextJob.printJobId, healthCheck.error);
        await QueueManager.failJob(nextJob.printJobId._id, healthCheck.error);
        return;
      }
      
      console.log(`✅ Printer health check passed`);

      // Simulate sending to printer and wait for result
      const success = await this.sendToPrinter(nextJob);

      if (success) {
        // Job completed successfully - actual print command was sent to printer
        await QueueManager.completeJob(nextJob.printJobId._id);
        console.log(`✅ Job ${nextJob.printJobId._id} completed successfully`);
        console.log(`📋 Print command sent to physical printer successfully`);
        
        // Check if we should print a blank separator page
        await this.insertBlankPageSeparatorIfNeeded(nextJob);
      } else {
        // Job failed - print command could not be sent
        const { handlePrintError } = require('./printErrorHandler');
        
        // Handle error with detailed analysis and notifications
        await handlePrintError(
          nextJob.printJobId, 
          'Printer communication failed - physical printer did not receive print job'
        );
        
        await QueueManager.failJob(nextJob.printJobId._id, 'Printer communication failed - physical printer did not receive print job');
        console.log(`❌ Job ${nextJob.printJobId._id} failed`);
        console.log(`⚠️ WARNING: Print job marked as failed because printer communication failed`);
      }

    } catch (error) {
      console.error('❌ Error processing job:', error.message);
      
      // Handle unexpected errors
      if (nextJob && nextJob.printJobId) {
        try {
          const { handlePrintError } = require('./printErrorHandler');
          await handlePrintError(nextJob.printJobId, error.message);
        } catch (handleError) {
          console.error('❌ Error handling print error:', handleError.message);
        }
      }
    }
  }

  /**
   * Insert a blank page separator after a completed job if needed
   * Only prints if:
   * 1. Printer has enableBlankPageSeparator setting enabled
   * 2. There is at least one more pending job in the queue
   * @param {Object} completedQueueItem - The queue item that just completed
   */
  async insertBlankPageSeparatorIfNeeded(completedQueueItem) {
    try {
      const Printer = require('../models/Printer');
      const printJob = completedQueueItem.printJobId;
      
      // Get printer configuration
      const printer = await Printer.findById(printJob.printerId);
      
      if (!printer) {
        console.warn(`⚠️ Printer not found for blank separator check: ${printJob.printerId}`);
        return;
      }
      
      // Check if blank page separator is enabled for this printer
      if (!printer.settings?.enableBlankPageSeparator) {
        console.log(`ℹ️ Blank page separator disabled for printer: ${printer.name}`);
        return;
      }
      
      // Check if there are more pending jobs in the queue
      const nextPendingJob = await QueueManager.getNextJob();
      
      if (!nextPendingJob) {
        console.log(`ℹ️ No more pending jobs - skipping blank page separator`);
        return;
      }
      
      console.log(`📄 Blank page separator enabled - another job is waiting`);
      console.log(`📋 Next job: ${nextPendingJob.printJobId._id} at position ${nextPendingJob.position}`);
      
      // Get the printer name for printing
      const { getPrinterName, printBlankPage } = require('../utils/printerUtils');
      const printerName = await getPrinterName(printJob.printerId);
      
      // Print the blank separator page
      const result = await printBlankPage(printerName, printJob._id);
      
      if (result.success) {
        console.log(`✅ Blank page separator inserted successfully`);
        console.log(`📋 Inserted blank page separator after job ${printJob._id}`);
      } else {
        // Log warning but don't fail the job - separator is non-critical
        console.warn(`⚠️ Failed to print blank separator (non-critical): ${result.error}`);
      }
      
    } catch (error) {
      // Log error but don't throw - blank page separator failure should not affect job processing
      console.error(`❌ Error inserting blank page separator (non-critical):`, error.message);
    }
  }

  /**
   * Send a job to the actual physical printer
   * Uses HP LaserJet Pro M201-M202 PCL 6
   */
  async sendToPrinter(queueItem) {
    const printJob = queueItem.printJobId;
    const { printFile, getPrinterName } = require('../utils/printerUtils');
    const { downloadFileByPublicId } = require('../utils/fileUtils');
    
    let tempFilePath = null;
    
    try {
      console.log(`📤 Sending to HP LaserJet: ${printJob.file.originalName}`);
      console.log(`📊 Pages: ${printJob.estimatedPages || printJob.totalPages || 1}`);
      console.log(`💰 Cost: ₹${printJob.pricing?.totalCost || 0}`);
      console.log(`🎨 Color: ${printJob.settings?.color ? 'Yes' : 'No'}`);
      console.log(`📄 Duplex: ${printJob.settings?.duplex ? 'Yes' : 'No'}`);
      
      // Download file from Cloudinary
      console.log(`📥 Downloading file from Cloudinary...`);
      console.log(`🔑 Public ID: ${printJob.file.publicId}`);
      
      tempFilePath = await downloadFileByPublicId(
        printJob.file.publicId,
        printJob.file.originalName
      );
      
      console.log(`✅ File downloaded to: ${tempFilePath}`);
      
      // Get printer name (will use HP LaserJet Pro M201-M202 PCL 6)
      const printerName = await getPrinterName(printJob.printerId);
      console.log(`🖨️ Target printer: ${printerName}`);
      
      // Send to actual printer
      console.log(`🖨️ Sending print command to physical printer...`);
      const printResult = await printFile(
        tempFilePath,
        printJob.settings,
        printerName,
        printJob.printerId
      );
      
      if (!printResult.success) {
        throw new Error(printResult.error || 'Print command failed');
      }
      
      console.log(`✅ Print job sent successfully to ${printerName}`);
      console.log(`⏱️ Processing time: ${printResult.processingTimeSeconds}s`);
      
      // Clean up temp file
      if (tempFilePath) {
        const fs = require('node:fs').promises;
        try {
          await fs.unlink(tempFilePath);
          console.log(`🗑️ Cleaned up temp file: ${tempFilePath}`);
        } catch (cleanupError) {
          console.warn(`⚠️ Failed to cleanup temp file:`, cleanupError.message);
        }
      }
      
      return true;

    } catch (error) {
      console.error(`🚫 Printer error for job ${printJob._id}:`, error.message);
      console.error(`📋 Error details:`, error);
      
      // Handle error with detailed analysis and notifications
      const { handlePrintError, logPrintError } = require('./printErrorHandler');
      
      // Log detailed error for diagnostics
      await logPrintError(printJob, error, {
        stage: 'sendToPrinter',
        tempFilePath,
        printerName: printJob.printer?.name,
      });
      
      // Create notifications and trigger SNMP check if needed
      await handlePrintError(printJob, error.message);
      
      // Clean up temp file on error
      if (tempFilePath) {
        const fs = require('node:fs').promises;
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.debug('Temp file cleanup failed:', cleanupError.message);
        }
      }
      
      return false;
    }
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isProcessing: this.isProcessing,
      intervalMs: this.intervalMs
    };
  }

  /**
   * Update processing interval
   */
  setInterval(intervalMs) {
    this.intervalMs = intervalMs;
    
    if (this.processingInterval) {
      this.stop();
      this.start();
    }
  }
}

// Export singleton instance
const queueProcessor = new QueueProcessor();

module.exports = queueProcessor;