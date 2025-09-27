const mongoose = require('mongoose');

// PrintedJobs Schema - for completed print job history
const printedJobSchema = new mongoose.Schema({
  // Original PrintJob ID reference
  originalJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintJob',
    required: true,
    index: true,
  },

  // User Details
  clerkUserId: {
    type: String,
    required: true,
    index: true,
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
  },
  printerName: {
    type: String,
    required: true,
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

  // Print Settings Used
  settings: {
    pages: {
      type: String,
      default: 'all',
    },
    copies: {
      type: Number,
      default: 1,
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

  // Cost Details
  cost: {
    baseCost: { type: Number, default: 0 },
    colorCost: { type: Number, default: 0 },
    paperCost: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
  },

  // Payment Information
  payment: {
    status: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
      default: 'paid',
    },
    method: {
      type: String,
      enum: ['student_credit', 'card', 'campus_card', 'cash', 'dev'],
      default: 'card',
    },
    transactionId: { type: String, trim: true },
    paidAt: { type: Date },
  },

  // Print Completion Details
  printedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  processingTimeSeconds: {
    type: Number,
    min: 0,
  },

  // Print Job Metadata
  wasReprint: { type: Boolean, default: false },
  reprintOfJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'PrintJob' },
  
  // Notes
  notes: { type: String, trim: true, maxlength: 500 },
  printQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good',
  },

}, {
  timestamps: true,
});

// Indexes for PrintedJobs
printedJobSchema.index({ clerkUserId: 1, printedAt: -1 });
printedJobSchema.index({ printerId: 1, printedAt: -1 });
printedJobSchema.index({ originalJobId: 1 });
printedJobSchema.index({ printedAt: -1 });

module.exports = mongoose.model('PrintedJob', printedJobSchema);