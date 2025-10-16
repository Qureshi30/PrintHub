const cron = require('node-cron');
const PrintJob = require('../models/PrintJob');
const Queue = require('../models/Queue');
const QueueManager = require('./queueManager');
const { cleanupTempFiles } = require('../utils/fileUtils');

/**
 * Auto-process stuck print jobs from Queue collection every 2 minutes
 * This is a backup processor that only handles jobs stuck in "in-progress" status
 * The main queueProcessor handles all "pending" jobs
 */
const startAutoPrintProcessor = () => {
  console.log('🤖 Starting backup auto-print processor (for stuck jobs only)...');
  
  // Check for stuck "in-progress" jobs every 2 minutes (less frequent to avoid conflicts)
  cron.schedule('*/2 * * * *', async () => {
    try {
      // Only look for jobs that are stuck in "in-progress" for more than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const stuckQueueItems = await Queue.find({
        status: 'in-progress',
        updatedAt: { $lt: fiveMinutesAgo }
      })
      .populate('printJobId')
      .sort({ position: 1 })
      .limit(5);

      if (stuckQueueItems.length > 0) {
        console.log(`⚠️ Backup processor: Found ${stuckQueueItems.length} stuck jobs...`);
        
        for (const queueItem of stuckQueueItems) {
          try {
            if (!queueItem.printJobId) {
              console.warn(`⚠️ Queue item ${queueItem._id} has no associated PrintJob`);
              // Clean up orphaned queue item
              await Queue.findByIdAndDelete(queueItem._id);
              continue;
            }

            console.log(`� Resetting stuck job: ${queueItem.printJobId.file.originalName}`);
            console.log(`⏰ Stuck since: ${queueItem.updatedAt}`);
            
            // Reset job back to pending so main processor can retry it
            queueItem.status = 'pending';
            await queueItem.save();
            
            console.log(`✅ Job reset to pending - main processor will retry`);
            
            // Small delay between jobs
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`❌ Backup processor error for queue item ${queueItem._id}:`, error.message);
            // If we can't reset it, fail the job
            try {
              await QueueManager.failJob(queueItem.printJobId._id, `Job was stuck in progress: ${error.message}`);
            } catch (failError) {
              console.error(`❌ Failed to mark job as failed:`, failError.message);
            }
          }
        }
      }
      
      // Log status if there are pending jobs waiting for main processor
      const pendingCount = await Queue.countDocuments({ status: 'pending' });
      if (pendingCount > 0) {
        console.log(`📊 Queue status: ${pendingCount} pending job(s) waiting for main processor`);
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