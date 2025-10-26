const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        index: true
    },
    studentName: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Printing Issues', 'Payment & Billing', 'Account Settings', 'General']
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    adminResponse: {
        type: String,
        default: ''
    },
    respondedBy: {
        type: String,
        default: null
    },
    respondedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for efficient querying
querySchema.index({ createdAt: -1 });
querySchema.index({ status: 1 });
querySchema.index({ studentId: 1, createdAt: -1 });

// Virtual for formatted creation time
querySchema.virtual('formattedCreatedAt').get(function () {
    return this.createdAt.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Ensure virtuals are included when converting to JSON
querySchema.set('toJSON', { virtuals: true });
querySchema.set('toObject', { virtuals: true });

const Query = mongoose.model('Query', querySchema);

module.exports = Query;
