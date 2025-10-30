// Check all recent completed jobs
require('dotenv').config();
const mongoose = require('mongoose');
const PrintJob = require('./src/models/PrintJob');
const Printer = require('./src/models/Printer');

async function checkRecentJobs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Get the 5 most recent completed jobs
    const recentJobs = await PrintJob.find({ 
      status: 'completed'
    })
      .populate('printerId', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    if (recentJobs.length === 0) {
      console.log('❌ No completed jobs found');
      await mongoose.disconnect();
      return;
    }

    console.log(`📄 Found ${recentJobs.length} recent completed jobs:\n`);
    
    recentJobs.forEach((job, index) => {
      console.log(`\n${index + 1}. ═══════════════════════════════════════════════════════════`);
      console.log('ID:', job._id);
      console.log('File:', job.file?.originalName);
      console.log('Completed:', job.updatedAt);
      console.log('Printer:', job.printerId?.name || 'Unknown');
      console.log('\n💵 Cost:');
      console.log('  baseCost:', job.cost?.baseCost || 0);
      console.log('  colorCost:', job.cost?.colorCost || 0);
      console.log('  paperCost:', job.cost?.paperCost || 0);
      console.log('  totalCost:', job.cost?.totalCost || 0);
      console.log('\n💳 Payment:');
      console.log('  status:', job.payment?.status || 'unknown');
      console.log('  method:', job.payment?.method || 'unknown');
      console.log('  amount:', job.payment?.amount || 0);
      console.log('  transactionId:', job.payment?.transactionId || 'none');
      console.log('\n📊 Pricing (legacy):');
      console.log('  totalCost:', job.pricing?.totalCost || 'not set');
    });
    
    console.log('\n═══════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkRecentJobs();
