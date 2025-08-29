const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    index: true,
  },
  printerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer',
    required: true,
    index: true,
  },
  file: {
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
    sizeKB: {
      type: Number,
      required: true,
    },
  },
  settings: {
    pages: {
      type: String,
      default: 'all',
      trim: true,
    },
    copies: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },
    color: {
      type: Boolean,
      default: false,
    },
    duplex: {
      type: Boolean,
      default: false,
    },
    paperType: {
      type: String,
      enum: ['A4', 'A3', 'Letter', 'Legal', 'Certificate'],
      default: 'A4',
    },
  },
  status: {
    type: String,
    enum: ['pending', 'queued', 'printing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  queuePosition: {
    type: Number,
    min: 0,
  },
  estimatedCompletionTime: {
    type: Date,
  },
  actualCompletionTime: {
    type: Date,
  },
  cost: {
    baseCost: {
      type: Number,
      default: 0,
    },
    colorCost: {
      type: Number,
      default: 0,
    },
    paperCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
  },
  misprint: {
    type: Boolean,
    default: false,
  },
  reprintCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  parentJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintJob',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  errorMessage: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
printJobSchema.index({ clerkUserId: 1, status: 1 });
printJobSchema.index({ printerId: 1, status: 1 });
printJobSchema.index({ status: 1, createdAt: -1 });
printJobSchema.index({ queuePosition: 1 });

// Pre-save middleware to calculate total cost
printJobSchema.pre('save', function(next) {
  if (this.isModified('cost') || this.isNew) {
    this.cost.totalCost = this.cost.baseCost + this.cost.colorCost + this.cost.paperCost;
  }
  next();
});

// Virtual for estimated pages (simple calculation)
printJobSchema.virtual('estimatedPages').get(function() {
  if (this.settings.pages === 'all') {
    return 1; // Default assumption, should be calculated from actual file
  }
  
  const pages = this.settings.pages;
  if (pages.includes('-')) {
    const [start, end] = pages.split('-').map(Number);
    return Math.max(0, end - start + 1);
  }
  
  if (pages.includes(',')) {
    return pages.split(',').length;
  }
  
  return 1;
});

// Virtual for total estimated cost
printJobSchema.virtual('estimatedTotalCost').get(function() {
  const pages = this.estimatedPages;
  const copies = this.settings.copies;
  
  // Base cost calculation (these should come from printer settings)
  const baseCostPerPage = 0.10; // $0.10 per page
  const colorMultiplier = this.settings.color ? 3 : 1; // Color costs 3x more
  const paperMultiplier = this.settings.paperType === 'A3' ? 2 : 1;
  
  return pages * copies * baseCostPerPage * colorMultiplier * paperMultiplier;
});

// Ensure virtual fields are serialized
printJobSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('PrintJob', printJobSchema);
