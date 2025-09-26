const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    index: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintJob',
    index: true,
  },
  type: {
    type: String,
    enum: ['job_completed', 'job_failed', 'reprint', 'queue_update', 'maintenance', 'system', 'payment', 'new_print_job', 'job_submitted'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
  metadata: {
    printerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Printer',
    },
    queuePosition: {
      type: Number,
    },
    estimatedTime: {
      type: Date,
    },
    cost: {
      type: Number,
    },
    errorCode: {
      type: String,
    },
    actionRequired: {
      type: Boolean,
      default: false,
    },
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    index: { expireAfterSeconds: 0 },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
notificationSchema.index({ clerkUserId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, read: 1 });

// Pre-save middleware to set readAt timestamp
notificationSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  return await notification.save();
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId, clerkUserId) {
  return await this.findOneAndUpdate(
    { _id: notificationId, clerkUserId },
    { read: true, readAt: new Date() },
    { new: true }
  );
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(clerkUserId) {
  return await this.updateMany(
    { clerkUserId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(clerkUserId) {
  return await this.countDocuments({ clerkUserId, read: false });
};

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Compound indexes for better performance
notificationSchema.index({ clerkUserId: 1, createdAt: -1 });
notificationSchema.index({ clerkUserId: 1, read: 1, createdAt: -1 });

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
