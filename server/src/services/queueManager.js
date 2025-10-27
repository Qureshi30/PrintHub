const Queue = require('../models/Queue');
const PrintJob = require('../models/PrintJob');
const Notification = require('../models/Notification');
const emailService = require('./unifiedEmailService');
const mongoose = require('mongoose');

class QueueManager {
  /**
   * Add a new print job to the queue with retry logic for write conflicts
   * @param {string} printJobId - The ObjectId of the PrintJob
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<Object>} The created queue item
   */
  static async enqueue(printJobId, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Verify the print job exists and is pending
        const printJob = await PrintJob.findById(printJobId).session(session);
        if (!printJob) {
          throw new Error('Print job not found');
        }

        if (printJob.status !== 'pending') {
          throw new Error('Only pending print jobs can be added to queue');
        }

        // Check if job is already in queue
        const existingQueueItem = await Queue.findOne({ printJobId }).session(session);
        if (existingQueueItem) {
          throw new Error('Print job is already in queue');
        }

        // Priority-based positioning
        let nextPosition;

        if (printJob.priority === 'high') {
          // High priority jobs go before all normal priority jobs
          // Find the last high priority job in queue
          const lastHighPriorityJob = await Queue.findOne({ status: { $in: ['pending', 'in-progress'] } })
            .sort({ position: -1 })
            .populate('printJobId')
            .session(session);

          // Check if the last job has high priority
          if (lastHighPriorityJob && lastHighPriorityJob.printJobId?.priority === 'high') {
            // Add after the last high priority job
            nextPosition = lastHighPriorityJob.position + 1;
          } else if (lastHighPriorityJob) {
            // There are jobs but no high priority ones, insert at position 1
            nextPosition = 1;
          } else {
            // Queue is empty
            nextPosition = 1;
          }

          // Shift all jobs at or after this position down
          // Use a temporary high position first to avoid conflicts
          const jobsToShift = await Queue.find({
            position: { $gte: nextPosition },
            status: { $in: ['pending', 'in-progress'] }
          })
            .sort({ position: -1 }) // Sort descending to shift from highest position first
            .session(session);

          // Shift each job's position by 1, starting from the highest position
          // Use a large offset first to avoid unique constraint violations
          const tempOffset = 10000;
          
          // Step 1: Move all jobs to temporary positions
          for (let i = 0; i < jobsToShift.length; i++) {
            const job = jobsToShift[i];
            await Queue.updateOne(
              { _id: job._id },
              { $set: { position: tempOffset + i } },
              { session }
            );
          }
          
          // Step 2: Move them back to final positions
          for (let i = 0; i < jobsToShift.length; i++) {
            const job = jobsToShift[i];
            await Queue.updateOne(
              { _id: job._id },
              { $set: { position: job.position + 1 } },
              { session }
            );
          }
        } else {
          // Normal priority jobs go to the end of the queue
          const lastPosition = await Queue.findOne(
            { status: { $in: ['pending', 'in-progress'] } }
          )
            .sort({ position: -1 })
            .select('position')
            .session(session);

          nextPosition = lastPosition ? lastPosition.position + 1 : 1;
        }

        // Create queue item
        const queueItem = new Queue({
          printJobId,
          position: nextPosition,
          status: 'pending'
        });

        await queueItem.save({ session });
        await session.commitTransaction();

        const priorityLabel = printJob.priority === 'high' ? ' (HIGH PRIORITY)' : '';
        console.log(`✅ Print job ${printJobId} added to queue at position ${nextPosition}${priorityLabel}`);
        return queueItem;

      } catch (error) {
        await session.abortTransaction();
        lastError = error;
        
        // Check if it's a write conflict that we should retry
        const isWriteConflict = error.message.includes('Write conflict') || 
                                error.message.includes('E11000');
        
        if (isWriteConflict && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 100; // Exponential backoff: 200ms, 400ms, 800ms
          console.log(`⚠️ Write conflict on attempt ${attempt}/${maxRetries}, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }
        
        // Non-retryable error or max retries reached
        console.error('❌ Error adding job to queue:', error.message);
        throw error;
      } finally {
        session.endSession();
      }
    }
    
    // If we get here, all retries failed
    throw lastError;
  }

  /**
   * Get the next job in queue (position 1, status pending)
   * @returns {Promise<Object|null>} The next queue item with populated print job
   */
  static async getNextJob() {
    try {
      const nextJob = await Queue.findOne({
        position: 1,
        status: 'pending'
      }).populate('printJobId');

      return nextJob;
    } catch (error) {
      console.error('❌ Error getting next job:', error.message);
      throw error;
    }
  }

  /**
   * Get the next pending job for each printer (per-printer queues)
   * Enables concurrent processing of multiple printers
   * @returns {Promise<Array>} Array of queue items (one per printer with pending jobs)
   */
  static async getNextJobsPerPrinter() {
    try {
      // Get all pending jobs with populated print job details
      const pendingJobs = await Queue.find({
        status: 'pending'
      })
        .populate({
          path: 'printJobId',
          populate: {
            path: 'printerId',
            model: 'Printer'
          }
        })
        .sort({ position: 1 }); // Sort by position

      if (!pendingJobs || pendingJobs.length === 0) {
        return [];
      }

      // Group jobs by printer and get the first job for each printer
      const printerJobsMap = new Map();
      
      for (const job of pendingJobs) {
        if (!job.printJobId || !job.printJobId.printerId) {
          console.warn(`⚠️ Job ${job._id} missing printer info, skipping`);
          continue;
        }

        const printerId = job.printJobId.printerId._id.toString();
        
        // Only keep the first job (lowest position) for each printer
        if (!printerJobsMap.has(printerId)) {
          printerJobsMap.set(printerId, job);
        }
      }

      // Convert map to array
      const nextJobs = Array.from(printerJobsMap.values());
      
      return nextJobs;
    } catch (error) {
      console.error('❌ Error getting next jobs per printer:', error.message);
      throw error;
    }
  }

  /**
   * Mark a job as in-progress
   * @param {string} queueItemId - The ObjectId of the Queue item
   * @returns {Promise<Object>} The updated queue item
   */
  static async markInProgress(queueItemId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const queueItem = await Queue.findById(queueItemId).session(session);
      if (!queueItem) {
        await session.abortTransaction();
        throw new Error('Queue item not found');
      }

      if (queueItem.status !== 'pending') {
        await session.abortTransaction();
        throw new Error(`Cannot mark job as in-progress - current status is: ${queueItem.status}`);
      }

      // Update queue item status using findOneAndUpdate to avoid write conflicts
      const updatedQueueItem = await Queue.findOneAndUpdate(
        { _id: queueItemId, status: 'pending' },
        { $set: { status: 'in-progress', updatedAt: new Date() } },
        { session, new: true }
      );

      if (!updatedQueueItem) {
        await session.abortTransaction();
        throw new Error('Queue item was modified by another process');
      }

      // Update print job status
      await PrintJob.findByIdAndUpdate(
        queueItem.printJobId,
        {
          status: 'in-progress',
          updatedAt: new Date()
        },
        { session }
      );

      await session.commitTransaction();
      console.log(`🟡 Print job ${queueItem.printJobId} marked as in-progress`);
      return queueItem;

    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Error marking job as in-progress:', error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Complete a job and remove it from queue
   * @param {string} printJobId - The ObjectId of the PrintJob
   * @returns {Promise<boolean>} Success status
   */
  static async completeJob(printJobId) {
    return this._finishJob(printJobId, 'completed');
  }

  /**
   * Fail a job and remove it from queue
   * @param {string} printJobId - The ObjectId of the PrintJob
   * @param {string} errorMessage - Optional error message
   * @returns {Promise<boolean>} Success status
   */
  static async failJob(printJobId, errorMessage = null) {
    return this._finishJob(printJobId, 'failed', errorMessage);
  }

  /**
   * Internal method to finish a job (complete or fail)
   * @private
   */
  static async _finishJob(printJobId, finalStatus, errorMessage = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find and remove the queue item
      const queueItem = await Queue.findOneAndDelete(
        { printJobId },
        { session }
      );

      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      // Update print job status
      const updateData = {
        status: finalStatus,
        updatedAt: new Date()
      };

      if (finalStatus === 'failed' && errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      if (finalStatus === 'completed') {
        updateData.completedAt = new Date();
      }

      await PrintJob.findByIdAndUpdate(printJobId, updateData, { session });

      // Create notification only for completed or failed jobs
      if (finalStatus === 'completed' || finalStatus === 'failed') {
        const printJob = await PrintJob.findById(printJobId).session(session);
        if (printJob && printJob.clerkUserId) {
          const notificationData = {
            clerkUserId: printJob.clerkUserId,
            jobId: printJobId,
            type: finalStatus === 'completed' ? 'job_completed' : 'job_failed',
            title: finalStatus === 'completed'
              ? 'Print Job Completed'
              : 'Print Job Failed',
            message: finalStatus === 'completed'
              ? `Your print job "${printJob.file.originalName}" is ready for pickup`
              : `Your print job "${printJob.file.originalName}" failed. ${errorMessage || 'Please contact support.'}`,
            priority: finalStatus === 'completed' ? 'medium' : 'high',
            read: false
          };

          // Create notification within the same transaction
          await Notification.create([notificationData], { session });
          console.log(`📧 ${finalStatus === 'completed' ? '✅' : '❌'} Notification created for user ${printJob.clerkUserId}`);

          // Send email notification (only for completed jobs for now)
          if (finalStatus === 'completed') {
            try {
              // Send email notification using the unified email service
              await emailService.sendPrintCompletionNotification(printJob);
              console.log(`📧 ✅ Email notification sent for completed job ${printJobId}`);
            } catch (emailError) {
              console.error('📧 ❌ Failed to send email notification:', emailError.message);
              // Don't throw error - email failure shouldn't prevent job completion
            }
          }
        }
      }

      // Reassign positions for remaining jobs
      await this._reassignPositions(session);

      await session.commitTransaction();

      const emoji = finalStatus === 'completed' ? '✅' : '❌';
      console.log(`${emoji} Print job ${printJobId} ${finalStatus}, removed from queue`);

      return true;

    } catch (error) {
      await session.abortTransaction();
      console.error(`❌ Error finishing job as ${finalStatus}:`, error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Reassign positions after a job is removed
   * @private
   */
  static async _reassignPositions(session = null) {
    try {
      // Get all remaining queue items in order
      const queueItems = await Queue.find({
        status: { $in: ['pending', 'in-progress'] }
      })
        .sort({ position: 1 })
        .session(session);

      // Reassign positions sequentially
      const bulkOps = queueItems.map((item, index) => ({
        updateOne: {
          filter: { _id: item._id },
          update: { position: index + 1 }
        }
      }));

      if (bulkOps.length > 0) {
        await Queue.bulkWrite(bulkOps, { session });
        console.log(`🔄 Reassigned positions for ${bulkOps.length} queue items`);
      }

    } catch (error) {
      console.error('❌ Error reassigning positions:', error.message);
      throw error;
    }
  }

  /**
   * Get the current queue ordered by position
   * @param {number} limit - Maximum number of items to return
   * @returns {Promise<Array>} Array of queue items with populated print jobs
   */
  static async getCurrentQueue(limit = 50) {
    try {
      const queue = await Queue.find({
        status: { $in: ['pending', 'in-progress'] }
      })
        .sort({ position: 1 })
        .limit(limit)
        .populate({
          path: 'printJobId',
          select: 'clerkUserId userName file.originalName totalCost estimatedPages status priority createdAt'
        });

      return queue;
    } catch (error) {
      console.error('❌ Error getting current queue:', error.message);
      throw error;
    }
  }

  /**
   * Get queue statistics
   * @returns {Promise<Object>} Queue statistics
   */
  static async getQueueStats() {
    try {
      const stats = await Queue.aggregate([
        {
          $match: {
            status: { $in: ['pending', 'in-progress'] }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        pending: 0,
        inProgress: 0
      };

      for (const stat of stats) {
        result.total += stat.count;
        if (stat._id === 'pending') {
          result.pending = stat.count;
        } else if (stat._id === 'in-progress') {
          result.inProgress = stat.count;
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Error getting queue stats:', error.message);
      throw error;
    }
  }
}

module.exports = QueueManager;