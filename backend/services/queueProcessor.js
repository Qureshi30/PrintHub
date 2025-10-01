const QueueManager = require('../services/queueManager');
const PrintJob = require('../models/PrintJob');

class QueueProcessor {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
    this.intervalMs = 5000; // Check every 5 seconds
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

      console.log(`🎯 Processing job ${nextJob.printJobId} at position ${nextJob.position}`);

      // Mark job as in-progress
      await QueueManager.markInProgress(nextJob._id);

      // Simulate sending to printer and wait for result
      const success = await this.sendToPrinter(nextJob);

      if (success) {
        // Job completed successfully
        await QueueManager.completeJob(nextJob.printJobId);
        console.log(`✅ Job ${nextJob.printJobId} completed successfully`);
      } else {
        // Job failed
        await QueueManager.failJob(nextJob.printJobId, 'Printer communication failed');
        console.log(`❌ Job ${nextJob.printJobId} failed`);
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
      console.log(`📄 Sending to printer: ${printJob.files?.length || 0} files, ${printJob.estimatedPages || 0} pages`);
      
      // Simulate printer processing time (2-10 seconds based on pages)
      const processingTime = Math.min(2000 + (printJob.estimatedPages || 1) * 100, 10000);
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Simulate random printer failures (5% chance)
      const failureChance = 0.05;
      if (Math.random() < failureChance) {
        throw new Error('Printer jam or communication error');
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
      isRunning: !!this.processingInterval,
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