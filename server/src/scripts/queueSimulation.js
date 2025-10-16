const mongoose = require('mongoose');
const PrintJob = require('../models/PrintJob');
const QueueManager = require('../services/queueManager');
const Queue = require('../models/Queue');
require('dotenv').config();

/**
 * Simulation script to demonstrate the print queue system
 * This script creates print jobs and shows how they flow through the queue
 */

class QueueSimulation {
  isConnected = false;

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/PrintHub');
      this.isConnected = true;
      console.log('✅ Connected to MongoDB for simulation');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      console.log('📡 Disconnected from MongoDB');
    }
  }

  /**
   * Create a sample print job
   */
  async createSamplePrintJob(jobData = {}) {
    const defaultJob = {
      clerkUserId: `user_${Date.now()}`,
      userName: 'Test User',
      userEmail: 'test@example.com',
      printerId: new mongoose.Types.ObjectId(), // Sample printer ID
      file: {
        cloudinaryUrl: 'https://example.com/sample.pdf',
        publicId: `sample_${Date.now()}`,
        originalName: `Sample_Document_${Date.now()}.pdf`,
        format: 'pdf',
        sizeKB: 1024,
      },
      totalPages: Math.floor(Math.random() * 10) + 1, // 1-10 pages
      estimatedPages: null,
      totalCost: Math.floor(Math.random() * 50) + 10, // 10-60 cost
      status: 'pending',
      colorMode: Math.random() > 0.5 ? 'color' : 'blackWhite',
      paperSize: 'A4',
      duplex: Math.random() > 0.5,
      copies: Math.floor(Math.random() * 3) + 1, // 1-3 copies
      ...jobData
    };

    const printJob = new PrintJob(defaultJob);
    await printJob.save();
    
    console.log(`📝 Created print job: ${printJob._id}`);
    console.log(`   📄 File: ${printJob.file.originalName}`);
    console.log(`   📊 Pages: ${printJob.totalPages}`);
    console.log(`   💰 Cost: ₹${printJob.totalCost}`);
    console.log(`   👤 User: ${printJob.userName}`);
    
    return printJob;
  }

  /**
   * Simulate the complete workflow
   */
  async runSimulation() {
    try {
      console.log('\n🚀 Starting Print Queue Simulation');
      console.log('='.repeat(50));

      // Step 1: Create multiple print jobs
      console.log('\n📝 Step 1: Creating Print Jobs');
      console.log('-'.repeat(30));
      
      const jobs = [];
      for (let i = 0; i < 5; i++) {
        const job = await this.createSamplePrintJob({
          userName: `User ${i + 1}`,
          userEmail: `user${i + 1}@example.com`,
          file: {
            cloudinaryUrl: `https://example.com/document${i + 1}.pdf`,
            publicId: `doc_${i + 1}_${Date.now()}`,
            originalName: `Document_${i + 1}.pdf`,
            format: 'pdf',
            sizeKB: 1024 + (i * 100),
          }
        });
        jobs.push(job);
        
        // Add a small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 2: Add jobs to queue
      console.log('\n⏰ Step 2: Adding Jobs to Queue');
      console.log('-'.repeat(30));
      
      for (const job of jobs) {
        try {
          const queueItem = await QueueManager.enqueue(job._id);
          console.log(`✅ Job ${job._id} added to queue at position ${queueItem.position}`);
        } catch (error) {
          console.log(`❌ Failed to add job ${job._id}: ${error.message}`);
        }
      }

      // Step 3: Show current queue
      console.log('\n📋 Step 3: Current Queue Status');
      console.log('-'.repeat(30));
      await this.showQueueStatus();

      // Step 4: Simulate processing some jobs
      console.log('\n🖨️ Step 4: Simulating Job Processing');
      console.log('-'.repeat(30));
      
      // Process 2 jobs manually to show the workflow
      for (let i = 0; i < 2; i++) {
        const nextJob = await QueueManager.getNextJob();
        if (nextJob) {
          console.log(`\n🎯 Processing job at position ${nextJob.position}`);
          console.log(`   📄 File: ${nextJob.printJobId.file.originalName}`);
          console.log(`   👤 User: ${nextJob.printJobId.userName}`);
          
          // Mark as in-progress
          await QueueManager.markInProgress(nextJob._id);
          console.log(`🟡 Marked as in-progress`);
          
          // Simulate processing time
          const processingTime = 2000 + (Math.random() * 3000); // 2-5 seconds
          console.log(`⏱️ Processing for ${Math.round(processingTime)}ms...`);
          await new Promise(resolve => setTimeout(resolve, processingTime));
          
          // Randomly succeed or fail (90% success rate)
          const success = Math.random() > 0.1;
          
          if (success) {
            await QueueManager.completeJob(nextJob.printJobId._id);
            console.log(`✅ Job completed successfully`);
          } else {
            await QueueManager.failJob(nextJob.printJobId._id, 'Simulated printer error');
            console.log(`❌ Job failed`);
          }
          
          // Show updated queue
          console.log('\n📋 Updated Queue:');
          await this.showQueueStatus();
        }
      }

      // Step 5: Final queue status
      console.log('\n📊 Step 5: Final Results');
      console.log('-'.repeat(30));
      
      const stats = await QueueManager.getQueueStats();
      console.log(`📈 Queue Statistics:`);
      console.log(`   Total jobs in queue: ${stats.total}`);
      console.log(`   Pending jobs: ${stats.pending}`);
      console.log(`   In-progress jobs: ${stats.inProgress}`);
      
      // Show all print jobs and their final status
      console.log('\n📄 All Print Jobs Status:');
      for (const job of jobs) {
        const updatedJob = await PrintJob.findById(job._id);
        console.log(`   ${job._id}: ${updatedJob.status.toUpperCase()}`);
      }

      console.log('\n🎉 Simulation completed successfully!');
      console.log('='.repeat(50));

    } catch (error) {
      console.error('❌ Simulation error:', error.message);
      throw error;
    }
  }

  /**
   * Show current queue status
   */
  async showQueueStatus() {
    try {
      const queue = await QueueManager.getCurrentQueue();
      
      if (queue.length === 0) {
        console.log('📭 Queue is empty');
        return;
      }

      console.log(`📋 Current queue (${queue.length} jobs):`);
      for (const item of queue) {
        const status = item.status === 'pending' ? '⏳' : '🟡';
        const file = item.printJobId.file.originalName;
        const user = item.printJobId.userName;
        console.log(`   ${status} Position ${item.position}: ${file} (${user}) - ${item.status}`);
      }
    } catch (error) {
      console.error('❌ Error showing queue status:', error.message);
    }
  }

  /**
   * Clean up - remove all test data
   */
  async cleanup() {
    try {
      console.log('\n🧹 Cleaning up test data...');
      
      // Remove all queue items
      const queueResult = await Queue.deleteMany({});
      console.log(`🗑️ Removed ${queueResult.deletedCount} queue items`);
      
      // Remove test print jobs (those created in last 10 minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const jobResult = await PrintJob.deleteMany({
        createdAt: { $gte: tenMinutesAgo },
        userName: { $regex: /^(Test User|User \d+)$/ }
      });
      console.log(`🗑️ Removed ${jobResult.deletedCount} test print jobs`);
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  }
}

// Run simulation if called directly
if (require.main === module) {
  // eslint-disable-next-line unicorn/prefer-top-level-await -- CommonJS module
  (async () => {
    const simulation = new QueueSimulation();
    
    try {
      await simulation.connect();
      await simulation.runSimulation();
      console.log('\n❓ Would you like to clean up test data? (You can run cleanup separately)');
      // Uncomment the next line to auto-cleanup
      // await simulation.cleanup();
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      simulation.disconnect();
    }
  })();
}

module.exports = QueueSimulation;