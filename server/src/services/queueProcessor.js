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

    console.log('🚀 Starting print queue processor...');
    this.isRunning = true;
    
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, this.intervalMs);

    // Process immediately on start
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
      return; // Already processing a job
    }

    try {
      this.isProcessing = true;

      // Get the next pending job
      const nextJob = await QueueManager.getNextJob();
      
      if (!nextJob) {
        // No jobs to process
        return;
      }

      console.log(`🎯 Processing job ${nextJob.printJobId._id} at position ${nextJob.position}`);
      console.log(`📄 File: ${nextJob.printJobId.file.originalName}`);
      console.log(`👤 User: ${nextJob.printJobId.userName || nextJob.printJobId.clerkUserId}`);

      // Mark job as in-progress
      await QueueManager.markInProgress(nextJob._id);

      // Simulate sending to printer and wait for result
      const success = await this.sendToPrinter(nextJob);

      if (success) {
        // Job completed successfully
        await QueueManager.completeJob(nextJob.printJobId._id);
        console.log(`✅ Job ${nextJob.printJobId._id} completed successfully`);
      } else {
        // Job failed
        await QueueManager.failJob(nextJob.printJobId._id, 'Printer communication failed');
        console.log(`❌ Job ${nextJob.printJobId._id} failed`);
      }

    } catch (error) {
      console.error('❌ Error processing queue:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Simulate sending a job to the printer
   * In a real implementation, this would communicate with actual printer hardware/software
   */
  async sendToPrinter(queueItem) {
    const printJob = queueItem.printJobId;
    
    try {
      console.log(`📤 Sending to printer: ${printJob.file.originalName}`);
      console.log(`📊 Pages: ${printJob.estimatedPages || printJob.totalPages || 1}`);
      console.log(`💰 Cost: ₹${printJob.totalCost || 0}`);
      
      // Simulate printer processing time (2-10 seconds based on pages)
      const pages = printJob.estimatedPages || printJob.totalPages || 1;
      const processingTime = Math.min(2000 + pages * 500, 10000);
      
      console.log(`⏱️ Estimated print time: ${processingTime}ms`);
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Simulate random printer failures (10% chance for demo purposes)
      const failureChance = 0.1;
      if (Math.random() < failureChance) {
        throw new Error('Simulated printer jam or communication error');
      }

      // Simulate successful printing
      console.log(`🖨️ Printer finished job ${printJob._id} (${processingTime}ms)`);
      return true;

    } catch (error) {
      console.error(`🚫 Printer error for job ${printJob._id}:`, error.message);
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