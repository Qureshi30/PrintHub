const mongoose = require('mongoose');

const cashPrintRequestSchema = new mongoose.Schema({
    // User information
    clerkUserId: {
        type: String,
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },

    // Printer information
    printerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Printer',
        required: true
    },

    // File information
    file: {
        cloudinaryUrl: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        format: {
            type: String,
            required: true
        },
        sizeKB: {
            type: Number,
            required: true
        }
    },

    // Print settings
    settings: {
        pages: {
            type: String,
            required: true
        },
        copies: {
            type: Number,
            default: 1,
            min: 1
        },
        color: {
            type: Boolean,
            default: false
        },
        duplex: {
            type: Boolean,
            default: false
        },
        paperType: {
            type: String,
            enum: ['A4', 'Letter', 'Legal', 'A3'],
            default: 'A4'
        }
    },

    // Cost information
    cost: {
        totalCost: {
            type: Number,
            required: true,
            min: 0
        }
    },

    // Payment information
    payment: {
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled'],
            default: 'pending'
        },
        method: {
            type: String,
            default: 'cash'
        }
    },

    // Timing information
    timing: {
        submittedAt: {
            type: Date,
            default: Date.now,
            index: true
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date
        }
    },

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending',
        index: true
    },

    // Admin notes (optional)
    adminNotes: {
        type: String
    },

    // Approved by admin
    approvedBy: {
        type: String // Clerk User ID of admin who approved
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
cashPrintRequestSchema.index({ status: 1, 'timing.submittedAt': -1 });
cashPrintRequestSchema.index({ clerkUserId: 1, status: 1 });

// Update timing.updatedAt before save
cashPrintRequestSchema.pre('save', function (next) {
    this.timing.updatedAt = Date.now();
    next();
});

const CashPrintRequest = mongoose.model('CashPrintRequest', cashPrintRequestSchema);

module.exports = CashPrintRequest;
