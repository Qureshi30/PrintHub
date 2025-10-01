/**
 * Simple Queue Demonstration Script
 * Shows how the print queue system works without requiring authentication
 */

const mongoose = require('mongoose');
const PrintJob = require('../models/PrintJob');
const QueueManager = require('../services/queueManager');
const Queue = require('../models/Queue');

// Simple demo without .env dependency
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/PrintHub';

async function demonstrateQueue() {
  console.log('🚀 Print Queue System Demonstration');
  console.log('='.repeat(50));

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Create a sample print job
    console.log('\n📝 Step 1: Creating a Print Job');
    console.log('-'.repeat(30));
    
    const samplePrintJob = new PrintJob({
      clerkUserId: `demo_user_${Date.now()}`,
      userName: 'Demo User',
      userEmail: 'demo@example.com',
      printerId: new mongoose.Types.ObjectId(), // Using a sample ObjectId
      file: {
        cloudinaryUrl: 'https://example.com/demo.pdf',
        publicId: `demo_${Date.now()}`,
        originalName: 'Demo_Document.pdf',
        format: 'pdf',
        sizeKB: 2048,
      },
      totalPages: 5,
      totalCost: 25,
      status: 'pending', // This is key - pending status triggers queue addition
      colorMode: 'color',
      paperSize: 'A4',
      duplex: false,
      copies: 2
    });

    await samplePrintJob.save();
    console.log(`✅ Created print job: ${samplePrintJob._id}`);
    console.log(`   📄 File: ${samplePrintJob.file.originalName}`);
    console.log(`   📊 Pages: ${samplePrintJob.totalPages}`);
    console.log(`   💰 Cost: ₹${samplePrintJob.totalCost}`);
    console.log(`   ⏱️ Status: ${samplePrintJob.status}`);

    // Step 2: Add to queue (this happens automatically in the Express route)
    console.log('\n⏰ Step 2: Adding to Queue (Simulating Express.js route)');
    console.log('-'.repeat(30));
    
    const queueItem = await QueueManager.enqueue(samplePrintJob._id);
    console.log(`✅ Added to queue at position: ${queueItem.position}`);
    console.log(`   📋 Queue Status: ${queueItem.status}`);

    // Step 3: Show current queue
    console.log('\n📋 Step 3: Current Queue State');
    console.log('-'.repeat(30));
    
    const currentQueue = await QueueManager.getCurrentQueue();
    if (currentQueue.length > 0) {
      currentQueue.forEach((item, index) => {
        console.log(`   Position ${item.position}: Job ${item.printJobId._id} (${item.status})`);
        console.log(`      📄 File: ${item.printJobId.file.originalName}`);
        console.log(`      👤 User: ${item.printJobId.userName}`);
      });
    } else {
      console.log('   📭 Queue is empty');
    }

    // Step 4: Simulate queue processor picking up the job
    console.log('\n🖨️ Step 4: Queue Processor Picks Up Job');
    console.log('-'.repeat(30));
    
    const nextJob = await QueueManager.getNextJob();
    if (nextJob) {
      console.log(`🎯 Processing job: ${nextJob.printJobId._id}`);
      console.log(`   📄 File: ${nextJob.printJobId.file.originalName}`);
      console.log(`   📍 Position: ${nextJob.position}`);
      
      // Mark as in-progress
      await QueueManager.markInProgress(nextJob._id);
      console.log(`🟡 Marked as in-progress`);
      
      // Simulate processing
      console.log('⏱️ Simulating printer processing (3 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Complete the job
      await QueueManager.completeJob(nextJob.printJobId._id);
      console.log('✅ Job completed and removed from queue');
    }

    // Step 5: Show final state
    console.log('\n📊 Step 5: Final State');
    console.log('-'.repeat(30));
    
    const finalQueue = await QueueManager.getCurrentQueue();
    console.log(`📋 Queue now has ${finalQueue.length} jobs`);
    
    const updatedPrintJob = await PrintJob.findById(samplePrintJob._id);
    console.log(`📄 Print job status: ${updatedPrintJob.status}`);
    
    const stats = await QueueManager.getQueueStats();
    console.log(`📈 Queue stats: ${stats.total} total, ${stats.pending} pending, ${stats.inProgress} in-progress`);

    console.log('\n🎉 Demonstration Complete!');
    console.log('='.repeat(50));
    console.log('\n✨ What just happened:');
    console.log('1. ✅ Created a PrintJob with status "pending"');
    console.log('2. ⏰ Added it to the Queue collection with position 1');
    console.log('3. 🖨️ Queue processor picked it up (Express.js would do this)');
    console.log('4. 🟡 Changed status to "in-progress"');
    console.log('5. ✅ Completed the job and removed from queue');
    console.log('6. 🔄 Queue positions automatically reassigned');
    
    console.log('\n💡 Key Points:');
    console.log('• Express.js queries Queue collection, not PrintJob directly');
    console.log('• Jobs are processed in FIFO order (position 1 first)');
    console.log('• Completed jobs are automatically removed from queue');
    console.log('• Queue maintains proper ordering automatically');

    // Cleanup
    await PrintJob.findByIdAndDelete(samplePrintJob._id);
    console.log('\n🧹 Cleaned up demo data');

  } catch (error) {
    console.error('❌ Demonstration failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  demonstrateQueue();
}

module.exports = demonstrateQueue;