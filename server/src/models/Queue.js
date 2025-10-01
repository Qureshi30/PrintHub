const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  printJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintJob',
    required: true,
    unique: true // Ensure each print job can only be in queue once
  },
  position: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending',
    required: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for efficient querying by position and status
queueSchema.index({ position: 1, status: 1 });
queueSchema.index({ status: 1, position: 1 });

// Ensure position is unique for pending and in-progress jobs
queueSchema.index({ position: 1 }, { 
  unique: true, 
  partialFilterExpression: { 
    status: { $in: ['pending', 'in-progress'] } 
  } 
});

module.exports = mongoose.model('Queue', queueSchema);