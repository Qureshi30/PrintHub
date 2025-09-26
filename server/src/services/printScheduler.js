const cron = require('node-cron');
const PrintJob = require('../models/PrintJob');
const { printJobById } = require('../controllers/printJobController');
const { cleanupTempFiles } = require('../utils/fileUtils');

/**
 * Auto-process pending print jobs every 30 seconds
 */
const startAutoPrintProcessor = () => {
  console.log('🤖 Starting auto-print processor...');
  
  // Process pending jobs every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const pendingJobs = await PrintJob.find({
        status: { $in: ['pending', 'queued'] }
      })
      .sort({ 'timing.submittedAt': 1 }) // FIFO order
      .limit(5); // Process max 5 jobs at a time

      if (pendingJobs.length > 0) {
        console.log(`🔄 Auto-processing ${pendingJobs.length} pending jobs...`);
        
        for (const job of pendingJobs) {
          try {
            // Create mock request/response objects for controller
            const mockReq = {
              params: { id: job._id.toString() },
              body: {}, // Use default printer
            };
            
            const mockRes = {
              status: (code) => mockRes,
              json: (data) => {
                if (data.success) {
                  console.log(`✅ Auto-printed job ${job._id}: ${job.file.originalName}`);
                } else {
                  console.error(`❌ Auto-print failed for job ${job._id}:`, data.error);
                }
                return mockRes;
              },
            };
            
            // Process the print job
            await printJobById(mockReq, mockRes);
            
            // Small delay between jobs to prevent overwhelming the printer
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error) {
            console.error(`❌ Error auto-processing job ${job._id}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Auto-print processor error:', error.message);
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
 * Update job queue positions every 5 minutes
 */
const startQueuePositionUpdater = () => {
  console.log('📊 Starting queue position updater...');
  
  // Update queue positions every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const pendingJobs = await PrintJob.find({
        status: { $in: ['pending', 'queued'] }
      }).sort({ 'timing.submittedAt': 1 });

      // Update queue positions
      for (let i = 0; i < pendingJobs.length; i++) {
        const job = pendingJobs[i];
        if (job.queuePosition !== i + 1) {
          job.queuePosition = i + 1;
          job.status = 'queued'; // Mark as queued once position is assigned
          await job.save();
        }
      }

      if (pendingJobs.length > 0) {
        console.log(`📊 Updated queue positions for ${pendingJobs.length} jobs`);
      }
    } catch (error) {
      console.error('❌ Queue position update failed:', error.message);
    }
  });
};

/**
 * Start all background schedulers
 */
const startAllSchedulers = () => {
  startAutoPrintProcessor();
  startTempFileCleanup();
  startQueuePositionUpdater();
  
  console.log('🚀 All background schedulers started successfully');
};

module.exports = {
  startAutoPrintProcessor,
  startTempFileCleanup,
  startQueuePositionUpdater,
  startAllSchedulers,
};