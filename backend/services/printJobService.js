// Enhanced PrintJob creation with automatic queue integration
const PrintJob = require('../models/PrintJob');
const QueueManager = require('../services/queueManager');

/**
 * Enhanced PrintJob service with queue integration
 */
class PrintJobService {
  /**
   * Create a new print job and automatically add it to the queue
   */
  static async createPrintJob(jobData) {
    try {
      // Create the print job
      const printJob = new PrintJob({
        ...jobData,
        status: 'pending' // Ensure it starts as pending
      });

      await printJob.save();
      console.log(`📝 Created print job: ${printJob._id}`);

      // Automatically add to queue if status is pending
      if (printJob.status === 'pending') {
        try {
          const queueItem = await QueueManager.enqueue(printJob._id);
          console.log(`⏰ Added to queue at position ${queueItem.position}`);
          
          return {
            printJob,
            queueItem,
            queuePosition: queueItem.position
          };
        } catch (queueError) {
          console.error('Failed to add to queue:', queueError.message);
          // Don't fail the entire operation if queue addition fails
          return {
            printJob,
            queueItem: null,
            queuePosition: null,
            queueError: queueError.message
          };
        }
      }

      return { printJob };

    } catch (error) {
      console.error('Error creating print job:', error);
      throw error;
    }
  }

  /**
   * Update print job status with queue synchronization
   */
  static async updatePrintJobStatus(printJobId, newStatus, additionalData = {}) {
    try {
      const printJob = await PrintJob.findByIdAndUpdate(
        printJobId,
        {
          status: newStatus,
          ...additionalData,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!printJob) {
        throw new Error('Print job not found');
      }

      // Handle queue operations based on status
      switch (newStatus) {
        case 'pending':
          // Add to queue if not already there
          try {
            await QueueManager.enqueue(printJobId);
          } catch (error) {
            // Ignore if already in queue
            if (!error.message.includes('already in queue')) {
              console.error('Error adding to queue:', error.message);
            }
          }
          break;

        case 'completed':
          // Remove from queue and mark as completed
          try {
            await QueueManager.completeJob(printJobId);
          } catch (error) {
            console.error('Error completing job in queue:', error.message);
          }
          break;

        case 'failed':
        case 'cancelled':
          // Remove from queue and mark as failed
          try {
            await QueueManager.failJob(printJobId, additionalData.errorMessage);
          } catch (error) {
            console.error('Error failing job in queue:', error.message);
          }
          break;
      }

      return printJob;

    } catch (error) {
      console.error('Error updating print job status:', error);
      throw error;
    }
  }

  /**
   * Get print job with queue information
   */
  static async getPrintJobWithQueue(printJobId) {
    try {
      const printJob = await PrintJob.findById(printJobId);
      if (!printJob) {
        throw new Error('Print job not found');
      }

      // Get queue information if job is in queue
      let queueInfo = null;
      if (['pending', 'in-progress'].includes(printJob.status)) {
        const queueItem = await Queue.findOne({ printJobId });
        if (queueItem) {
          queueInfo = {
            position: queueItem.position,
            queueStatus: queueItem.status,
            queuedAt: queueItem.createdAt,
            estimatedWait: await this.calculateEstimatedWait(queueItem.position)
          };
        }
      }

      return {
        ...printJob.toObject(),
        queue: queueInfo
      };

    } catch (error) {
      console.error('Error getting print job with queue:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated wait time based on queue position
   */
  static async calculateEstimatedWait(position) {
    try {
      // Average 2 minutes per job (this can be made more sophisticated)
      const avgTimePerJob = 2 * 60 * 1000; // 2 minutes in milliseconds
      const estimatedWait = (position - 1) * avgTimePerJob;
      
      return Math.max(0, estimatedWait);
    } catch (error) {
      console.error('Error calculating estimated wait:', error);
      return 0;
    }
  }
}

module.exports = PrintJobService;