const QueueManager = require('../services/queueManager');
const PrintJob = require('../models/PrintJob');

class QueueProcessor {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
    this.intervalMs = 5000; // Check every 5 seconds
    this.isRunning = false;
  }

  /**
   * Start the queue processor
   */
  start() {
    if (this.processingInterval) {
      console.log('🟡 Queue processor is already running');
      return;
    }

    console.log('🚀 Starting print queue processor with REAL PRINTING...');
    console.log('🖨️ Using HP LaserJet Pro M201-M202 PCL 6');
    console.log(`⏱️ Checking for new jobs every ${this.intervalMs}ms (${this.intervalMs/1000} seconds)`);
    this.isRunning = true;
    
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, this.intervalMs);

    // Process immediately on start
    console.log('🔍 Checking for pending jobs immediately...');
    this.processNextJob();
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
   * Process the next job in the queue
   */
  async processNextJob() {
    if (this.isProcessing) {
      console.log('⏳ Already processing a job, skipping this cycle...');
      return; // Already processing a job
    }

    try {
      this.isProcessing = true;

      // Get the next pending job
      const nextJob = await QueueManager.getNextJob();
      
      if (!nextJob) {
        // No jobs to process - this is normal, don't log unless in debug mode
        return;
      }

      console.log('═══════════════════════════════════════════════');
      console.log(`🎯 MAIN PROCESSOR: Starting job ${nextJob.printJobId._id}`);
      console.log(`📄 File: ${nextJob.printJobId.file.originalName}`);
      console.log(`📊 Position: ${nextJob.position}`);
      console.log(`👤 User: ${nextJob.printJobId.userName || nextJob.printJobId.clerkUserId}`);
      console.log('═══════════════════════════════════════════════');

      // Mark job as in-progress
      await QueueManager.markInProgress(nextJob._id);

      // Simulate sending to printer and wait for result
      const success = await this.sendToPrinter(nextJob);

      if (success) {
        // Job completed successfully - actual print command was sent to printer
        await QueueManager.completeJob(nextJob.printJobId._id);
        console.log(`✅ Job ${nextJob.printJobId._id} completed successfully`);
        console.log(`📋 Print command sent to physical printer successfully`);
      } else {
        // Job failed - print command could not be sent
        await QueueManager.failJob(nextJob.printJobId._id, 'Printer communication failed - physical printer did not receive print job');
        console.log(`❌ Job ${nextJob.printJobId._id} failed`);
        console.log(`⚠️ WARNING: Print job marked as failed because printer communication failed`);
      }

    } catch (error) {
      console.error('❌ Error processing queue:', error.message);
    } finally {
      this.isProcessing = false;
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
        const fs = require('fs').promises;
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
      
      // Clean up temp file on error
      if (tempFilePath) {
        const fs = require('fs').promises;
        try {
          await fs.unlink(tempFilePath);
        } catch (cleanupError) {
          // Ignore cleanup errors
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