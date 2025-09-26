const mongoose = require('mongoose');
const PrintJob = require('./src/models/PrintJob');

mongoose.connect('mongodb://localhost:27017/PrintHub')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check for pending/queued jobs
    const pendingJobs = await PrintJob.find({ 
      status: { $in: ['pending', 'queued'] } 
    });
    
    console.log('Pending/Queued Jobs:', pendingJobs.length);
    pendingJobs.forEach(job => {
      console.log({
        id: job._id,
        status: job.status,
        fileName: job.file?.originalName,
        submittedAt: job.timing?.submittedAt
      });
    });
    
    // Check all job statuses
    const allJobs = await PrintJob.find({});
    console.log('\nAll Jobs Status Summary:');
    const statusCounts = {};
    allJobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });
    console.log(statusCounts);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });