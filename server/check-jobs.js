const mongoose = require('mongoose');

// Define a minimal PrintJob schema for querying
const printJobSchema = new mongoose.Schema({}, { strict: false, collection: 'printjobs' });
const PrintJob = mongoose.model('PrintJob', printJobSchema);

async function checkPrintJobs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/printhub');
    console.log('Connected to MongoDB');
    
    const jobs = await PrintJob.find().sort({ createdAt: -1 }).limit(5);
    console.log('\nRecent print jobs:');
    console.log('==================');
    
    if (jobs.length === 0) {
      console.log('No print jobs found in database');
    } else {
      jobs.forEach((job, index) => {
        console.log(`${index + 1}. ID: ${job._id}`);
        console.log(`   Status: ${job.status || 'N/A'}`);
        console.log(`   File: ${job.file?.originalName || 'N/A'}`);
        console.log(`   PublicID: ${job.file?.publicId || 'N/A'}`);
        console.log(`   Created: ${job.createdAt || 'N/A'}`);
        console.log('   ---');
      });
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Database error:', error);
    process.exit(1);
  }
}

checkPrintJobs();