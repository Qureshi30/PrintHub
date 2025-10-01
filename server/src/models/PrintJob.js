const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
  // User Details
  clerkUserId: {
    type: String,
    required: true,
    index: true,
    alias: 'userId', // Also available as userId for easier access
  },
  userName: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  userEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  
  // Printer Details
  printerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer',
    required: true,
    index: true,
  },
  
  // File Details
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
      alias: 'originalFileName', // Also available as originalFileName
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
  
  // Print Settings
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
  
  // Queue & Status
  status: {
    type: String,
    enum: ['pending', 'queued', 'in-progress', 'printing', 'completed', 'failed', 'cancelled'],
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
  
  // Cost Details
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
  
  // Payment Status
  payment: {
    amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    method: {
      type: String,
      enum: ['student_credit', 'card', 'campus_card', 'cash', 'dev'],
      default: 'student_credit',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      sparse: true, // Allow null values but create index for non-null values
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
      sparse: true,
    },
    paidAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  
  // Job History
  timing: {
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
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
  
  // Additional Fields
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
printJobSchema.index({ 'payment.razorpayOrderId': 1 });
printJobSchema.index({ 'payment.status': 1 });
printJobSchema.index({ status: 1, createdAt: -1 });
printJobSchema.index({ queuePosition: 1 });

// Pre-save middleware to calculate total cost
printJobSchema.pre('save', function (next) {
  if (this.isModified('cost') || this.isNew) {
    this.cost.totalCost = this.cost.baseCost + this.cost.colorCost + this.cost.paperCost;
  }
  next();
});

// Virtual fields temporarily disabled to fix notification serialization errors
// These can be re-enabled once proper error handling is implemented

// Ensure virtual fields are serialized when re-enabled
// printJobSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('PrintJob', printJobSchema);
