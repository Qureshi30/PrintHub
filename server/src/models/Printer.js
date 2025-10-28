const mongoose = require('mongoose');

const printerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'busy', 'error'],
    default: 'online',
    index: true,
  },
  queue: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintJob',
  }],
  specifications: {
    maxPaperSize: {
      type: String,
      enum: ['A4', 'A3', 'Letter', 'Legal', 'Certificate'],
      default: 'A4',
    },
    supportedPaperTypes: [{
      type: String,
      enum: ['A4', 'A3', 'Letter', 'Legal', 'Certificate'],
    }],
    colorSupport: {
      type: Boolean,
      default: false,
    },
    duplexSupport: {
      type: Boolean,
      default: true,
    },
    maxCopies: {
      type: Number,
      default: 100,
      min: 1,
    },
  },
  supplies: {
    inkLevel: {
      black: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
      cyan: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
      magenta: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
      yellow: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
    },
    paperLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    tonerLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
  },
  maintenance: {
    lastMaintenance: {
      type: Date,
      default: Date.now,
    },
    nextMaintenance: {
      type: Date,
    },
    maintenanceNotes: {
      type: String,
      trim: true,
    },
  },
  statistics: {
    totalJobsCompleted: {
      type: Number,
      default: 0,
    },
    totalPagesProcessed: {
      type: Number,
      default: 0,
    },
    averageProcessingTime: {
      type: Number,
      default: 0, // in minutes
    },
    lastJobCompletedAt: {
      type: Date,
    },
  },
  settings: {
    autoQueueProcessing: {
      type: Boolean,
      default: true,
    },
    maxQueueSize: {
      type: Number,
      default: 50,
      min: 1,
    },
    estimatedPrintSpeed: {
      type: Number,
      default: 20, // pages per minute
      min: 1,
    },
    enableBlankPageSeparator: {
      type: Boolean,
      default: true,
      description: 'Print a blank page between jobs to separate different users\' outputs',
    },
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
  lastKnownErrors: [{
    type: String,
    enum: ['lowPaper', 'noPaper', 'lowToner', 'noToner', 'doorOpen', 'jammed', 'offline', 'serviceRequested'],
  }],
  systemInfo: {
    driverName: {
      type: String,
      trim: true,
    },
    connectionType: {
      type: String,
      enum: ['Network', 'USB', 'Virtual', 'Wireless'],
      default: 'Network',
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    macAddress: {
      type: String,
      trim: true,
    },
  },
  pricing: {
    baseCostPerPage: {
      type: Number,
      default: 1,
      min: 0,
    },
    colorCostPerPage: {
      type: Number,
      default: 0,
      min: 0,
    },
    duplexCostPerPage: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
printerSchema.index({ status: 1, isActive: 1 });
printerSchema.index({ location: 1 });
printerSchema.index({ name: 1 });

// Virtual for queue length
printerSchema.virtual('queueLength').get(function() {
  return this.queue ? this.queue.length : 0;
});

// Virtual for available status
printerSchema.virtual('isAvailable').get(function() {
  return this.status === 'online' && this.isActive && this.queueLength < this.settings.maxQueueSize;
});

// Virtual for supply status
printerSchema.virtual('supplyStatus').get(function() {
  const { inkLevel, paperLevel, tonerLevel } = this.supplies;
  
  const minInkLevel = Math.min(
    inkLevel.black,
    inkLevel.cyan,
    inkLevel.magenta,
    inkLevel.yellow
  );
  
  const overallSupplyLevel = Math.min(minInkLevel, paperLevel, tonerLevel);
  
  if (overallSupplyLevel <= 10) return 'critical';
  if (overallSupplyLevel <= 25) return 'low';
  if (overallSupplyLevel <= 50) return 'medium';
  return 'good';
});

// Method to add job to queue
printerSchema.methods.addToQueue = function(jobId) {
  if (this.queue.length < this.settings.maxQueueSize) {
    this.queue.push(jobId);
    return true;
  }
  return false;
};

// Method to remove job from queue
printerSchema.methods.removeFromQueue = function(jobId) {
  this.queue = this.queue.filter(id => !id.equals(jobId));
};

// Method to get next job in queue
printerSchema.methods.getNextJob = function() {
  return this.queue.length > 0 ? this.queue[0] : null;
};

// Ensure virtual fields are serialized
printerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Printer', printerSchema);
