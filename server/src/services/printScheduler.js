const cron = require('node-cron');
const PrintJob = require('../models/PrintJob');
const Queue = require('../models/Queue');
const QueueManager = require('./queueManager');
const { cleanupTempFiles } = require('../utils/fileUtils');

/**
 * Auto-process pending print jobs from Queue collection every 30 seconds
 * This is a backup processor in case the main queueProcessor fails
 */
const startAutoPrintProcessor = () => {
  console.log('🤖 Starting backup auto-print processor...');
  
  // Process pending jobs from Queue collection every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      // Get pending jobs from Queue collection (not PrintJob collection)
      const pendingQueueItems = await Queue.find({
        status: 'pending'
      })
      .populate('printJobId')
      .sort({ position: 1 }) // FIFO order by position
      .limit(5); // Process max 5 jobs at a time

      if (pendingQueueItems.length > 0) {
        console.log(`🔄 Backup processor: Processing ${pendingQueueItems.length} pending queue items...`);
        
        for (const queueItem of pendingQueueItems) {
          try {
            if (!queueItem.printJobId) {
              console.warn(`⚠️ Queue item ${queueItem._id} has no associated PrintJob`);
              continue;
            }

            // Use QueueManager to properly process the job
            console.log(`🖨️ Backup processing: ${queueItem.printJobId.file.originalName}`);
            
            // Mark as in progress
            await QueueManager.markInProgress(queueItem._id);
            
            // Let the main queueProcessor handle actual printing
            // This backup processor only handles stuck jobs
            console.log(`⏭️ Backup processor skipping - main processor should handle printing`);
            
            // Small delay between jobs to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`❌ Backup processor error for queue item ${queueItem._id}:`, error.message);
            try {
              await QueueManager.failJob(queueItem.printJobId._id, error.message);
            } catch (failError) {
              console.error(`❌ Failed to mark job as failed:`, failError.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Backup auto-print processor error:', error.message);
    }
  });
};

/**
 * Cleanup temporary files every hour
 */
const startTempFileCleanup = () => {
  console.log('🧹 Starting temp file cleanup scheduler...');
  
  // Cleanup temp files every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🧹 Running scheduled temp file cleanup...');
      await cleanupTempFiles();
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error.message);
    }
  });
};

/**
 * Update queue positions - DEPRECATED: Now handled by QueueManager
 * This function is kept for backward compatibility but does nothing
 */
const startQueuePositionUpdater = () => {
  console.log('📊 Queue position updater: Using QueueManager auto-positioning...');
  
  // The QueueManager now handles position assignment automatically
  // This scheduler is no longer needed but kept for compatibility
  cron.schedule('*/5 * * * *', async () => {
    try {
      // Check if there are any orphaned PrintJobs that should be in queue
      const orphanedJobs = await PrintJob.find({
        status: 'pending'
      });

      for (const job of orphanedJobs) {
        // Check if this job is already in queue
        const existingQueueItem = await Queue.findOne({ printJobId: job._id });
        if (!existingQueueItem) {
          console.log(`🔄 Adding orphaned job ${job._id} to queue...`);
          await QueueManager.enqueue(job._id);
        }
      }

      if (orphanedJobs.length > 0) {
        console.log(`📊 Processed ${orphanedJobs.length} orphaned jobs`);
      }
    } catch (error) {
      console.error('❌ Orphaned job cleanup failed:', error.message);
    }
  });
};

/**
 * Start all background schedulers
 */
const startAllSchedulers = () => {
  startAutoPrintProcessor(); // Backup processor for queue items
  startTempFileCleanup();
  startQueuePositionUpdater(); // Orphaned job cleanup
  
  console.log('🚀 All background schedulers started successfully');
  console.log('📋 Note: Main queue processing handled by queueProcessor service');
};

module.exports = {
  startAutoPrintProcessor,
  startTempFileCleanup,
  startQueuePositionUpdater,
  startAllSchedulers,
};