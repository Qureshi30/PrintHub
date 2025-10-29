// Quick script to check current queue status
require('dotenv').config();
const mongoose = require('mongoose');
const Queue = require('./src/models/Queue');
const PrintJob = require('./src/models/PrintJob');

async function checkQueueStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Get all queue items
    const queueItems = await Queue.find({})
      .populate({
        path: 'printJobId',
        populate: { path: 'printerId', select: 'name' }
      })
      .sort({ position: 1 });

    console.log(`📊 Total items in Queue collection: ${queueItems.length}\n`);

    if (queueItems.length > 0) {
      console.log('Current Queue:');
      console.log('═══════════════════════════════════════════════════════════');
      
      queueItems.forEach(item => {
        const printer = item.printJobId?.printerId?.name || 'Unknown';
        const fileName = item.printJobId?.file?.originalName || 'Unknown file';
        console.log(`Position ${item.position} | ${item.status.padEnd(12)} | Printer: ${printer.padEnd(30)} | File: ${fileName}`);
      });
      
      console.log('═══════════════════════════════════════════════════════════\n');
      
      // Group by printer
      const printerGroups = {};
      queueItems.forEach(item => {
        const printer = item.printJobId?.printerId?.name || 'Unknown';
        if (!printerGroups[printer]) {
          printerGroups[printer] = [];
        }
        printerGroups[printer].push(item);
      });
      
      console.log('Jobs Per Printer:');
      console.log('═══════════════════════════════════════════════════════════');
      Object.keys(printerGroups).forEach(printer => {
        console.log(`\n📍 ${printer}: ${printerGroups[printer].length} job(s)`);
        printerGroups[printer].forEach((item, idx) => {
          console.log(`   ${idx + 1}. Position ${item.position} - ${item.status} - ${item.printJobId?.file?.originalName}`);
        });
      });
    } else {
      console.log('✨ Queue is empty - no jobs waiting\n');
    }

    // Check for orphaned jobs
    const orphanedJobs = await PrintJob.find({ status: 'pending' });
    const orphanedCount = orphanedJobs.length;
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`🔍 Orphaned Jobs (pending but not in queue): ${orphanedCount}`);
    
    if (orphanedCount > 0) {
      orphanedJobs.forEach(job => {
        console.log(`   - ${job._id}: ${job.file?.originalName || 'Unknown'}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkQueueStatus();
