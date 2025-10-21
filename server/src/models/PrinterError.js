const mongoose = require('mongoose');

const printerErrorSchema = new mongoose.Schema({
  printerName: {
    type: String,
    required: [true, 'Printer name is required'],
    trim: true,
  },
  printerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer',
    index: true,
  },
  errorType: {
    type: String,
    required: [true, 'Error type is required'],
    enum: [
      'Low Paper',
      'Out of Paper',
      'Low Toner',
      'Out of Toner',
      'Paper Jam',
      'Door Open',
      'Offline',
      'Service Requested',
      'Hardware Error',
      'Communication Error',
      'Print Queue Full',
      'Driver Error',
      'Other',
    ],
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  status: {
    type: String,
    required: true,
    enum: ['unresolved', 'in_progress', 'resolved', 'ignored'],
    default: 'unresolved',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  resolvedBy: {
    type: String,
    default: null,
  },
  resolutionNotes: {
    type: String,
    maxlength: [500, 'Resolution notes cannot exceed 500 characters'],
  },
  metadata: {
    ipAddress: String,
    location: String,
    errorCode: String,
    affectedJobs: Number,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for efficient querying
printerErrorSchema.index({ timestamp: -1 });
printerErrorSchema.index({ status: 1, timestamp: -1 });
printerErrorSchema.index({ printerName: 1, timestamp: -1 });
printerErrorSchema.index({ errorType: 1, status: 1 });

// Virtual for resolution time
printerErrorSchema.virtual('resolutionTime').get(function() {
  if (this.resolvedAt && this.timestamp) {
    return Math.round((this.resolvedAt - this.timestamp) / 1000 / 60); // minutes
  }
  return null;
});

// Virtual for age
printerErrorSchema.virtual('age').get(function() {
  return Math.round((Date.now() - this.timestamp) / 1000 / 60); // minutes
});

// Instance method to resolve error
printerErrorSchema.methods.resolve = function(resolvedBy, notes) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.resolutionNotes = notes;
  return this.save();
};

// Static method to get unresolved errors
printerErrorSchema.statics.getUnresolved = function() {
  return this.find({ status: 'unresolved' })
    .populate('printerId', 'name location model')
    .sort({ priority: -1, timestamp: -1 });
};

// Static method to get error statistics
printerErrorSchema.statics.getStats = async function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$errorType',
        count: { $sum: 1 },
        unresolved: {
          $sum: { $cond: [{ $eq: ['$status', 'unresolved'] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
        },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'resolved'] },
              { $divide: [{ $subtract: ['$resolvedAt', '$timestamp'] }, 60000] },
              null,
            ],
          },
        },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return stats;
};

// Pre-save middleware to set priority based on error type
printerErrorSchema.pre('save', function(next) {
  if (this.isNew && !this.priority) {
    const urgentErrors = ['Out of Paper', 'Out of Toner', 'Offline', 'Hardware Error'];
    const highErrors = ['Low Paper', 'Low Toner', 'Paper Jam', 'Service Requested'];
    const mediumErrors = ['Door Open', 'Print Queue Full'];
    
    if (urgentErrors.includes(this.errorType)) {
      this.priority = 'urgent';
    } else if (highErrors.includes(this.errorType)) {
      this.priority = 'high';
    } else if (mediumErrors.includes(this.errorType)) {
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }
  next();
});

const PrinterError = mongoose.model('PrinterError', printerErrorSchema);

module.exports = PrinterError;
