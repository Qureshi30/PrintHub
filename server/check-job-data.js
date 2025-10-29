// Check specific job data structure
require('dotenv').config();
const mongoose = require('mongoose');
const PrintJob = require('./src/models/PrintJob');
const Printer = require('./src/models/Printer'); // Need to load model

async function checkJobData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Get the most recent completed job
    const recentJob = await PrintJob.findOne({ 
      status: 'completed',
      'file.originalName': /Test.*Copy/i 
    })
      .populate('printerId', 'name')
      .sort({ 'timing.completedAt': -1 });

    if (!recentJob) {
      console.log('❌ No matching job found');
      await mongoose.disconnect();
      return;
    }

    console.log('📄 Job Details:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ID:', recentJob._id);
    console.log('File:', recentJob.file?.originalName);
    console.log('Status:', recentJob.status);
    console.log('Printer:', recentJob.printerId?.name);
    console.log('\n💰 PRICING DATA:');
    console.log('pricing field:', JSON.stringify(recentJob.pricing, null, 2));
    console.log('\n💵 COST DATA:');
    console.log('cost field:', JSON.stringify(recentJob.cost, null, 2));
    console.log('\n💳 PAYMENT DATA:');
    console.log('payment field:', JSON.stringify(recentJob.payment, null, 2));
    console.log('\n📊 Full Document Structure:');
    console.log(JSON.stringify(recentJob.toObject(), null, 2));
    console.log('═══════════════════════════════════════════════════════════');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkJobData();
