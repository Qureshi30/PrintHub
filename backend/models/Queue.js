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

// Pre-save middleware to validate status transitions
queueSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    // Only allow pending -> in-progress -> completed/failed transitions
    const allowedTransitions = {
      'pending': ['in-progress'],
      'in-progress': ['completed', 'failed'],
      'completed': [], // No transitions from completed
      'failed': [] // No transitions from failed
    };

    if (this.isNew) {
      // New documents can only start as pending
      if (this.status !== 'pending') {
        return next(new Error('New queue items must start with status "pending"'));
      }
    } else {
      const originalStatus = this._original?.status;
      if (originalStatus && !allowedTransitions[originalStatus].includes(this.status)) {
        return next(new Error(`Invalid status transition from ${originalStatus} to ${this.status}`));
      }
    }
  }
  next();
});

// Store original document for comparison in pre-save
queueSchema.pre('save', function(next) {
  if (!this.isNew) {
    this._original = this.constructor.findOne({ _id: this._id }).lean();
  }
  next();
});

module.exports = mongoose.model('Queue', queueSchema);