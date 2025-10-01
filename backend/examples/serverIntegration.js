// Example integration in your main app.js or server.js file

const express = require('express');
const mongoose = require('mongoose');
const queueRoutes = require('./routes/queue');
const queueProcessor = require('./services/queueProcessor');
const PrintJobService = require('./services/printJobService');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/queue', queueRoutes);

// Example route to create a print job (with automatic queue integration)
app.post('/api/print-jobs', async (req, res) => {
  try {
    const result = await PrintJobService.createPrintJob(req.body);
    
    res.status(201).json({
      success: true,
      data: result,
      message: result.queueItem 
        ? `Print job created and added to queue at position ${result.queuePosition}`
        : 'Print job created but not added to queue'
    });
  } catch (error) {
    console.error('Error creating print job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create print job',
      error: error.message
    });
  }
});

// Example route to get print job with queue info
app.get('/api/print-jobs/:id', async (req, res) => {
  try {
    const printJob = await PrintJobService.getPrintJobWithQueue(req.params.id);
    
    res.json({
      success: true,
      data: printJob
    });
  } catch (error) {
    console.error('Error fetching print job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch print job',
      error: error.message
    });
  }
});

// Queue processor management routes
app.post('/api/queue/processor/start', (req, res) => {
  try {
    queueProcessor.start();
    res.json({
      success: true,
      message: 'Queue processor started',
      status: queueProcessor.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start queue processor',
      error: error.message
    });
  }
});

app.post('/api/queue/processor/stop', (req, res) => {
  try {
    queueProcessor.stop();
    res.json({
      success: true,
      message: 'Queue processor stopped',
      status: queueProcessor.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop queue processor',
      error: error.message
    });
  }
});

app.get('/api/queue/processor/status', (req, res) => {
  res.json({
    success: true,
    data: queueProcessor.getStatus()
  });
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start the queue processor
    queueProcessor.start();
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('📋 Queue system initialized');
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  queueProcessor.stop();
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;