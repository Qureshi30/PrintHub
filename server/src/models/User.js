const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'staff'],
    default: 'student',
    required: true,
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    defaultPaperType: {
      type: String,
      enum: ['A4', 'A3', 'Letter', 'Legal', 'Certificate'],
      default: 'A4',
    },
    defaultColor: {
      type: Boolean,
      default: false,
    },
  },
  statistics: {
    totalJobs: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
userSchema.index({ clerkUserId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'profile.email': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || 'User';
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
