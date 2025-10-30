const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: [
      'reprint',
      'cancel_job',
      'terminate_job',
      'printer_maintenance',
      'user_action',
      'system_config',
      'user_suspend',
      'user_activate',
      'printer_add',
      'printer_remove',
      'printer_update',
      'bulk_action',
      'data_export',
      'settings_update'
    ],
    required: true,
    index: true,
  },
  target: {
    type: {
      type: String,
      enum: ['user', 'printer', 'print_job', 'system'],
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintJob',
    index: true,
  },
  printerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer',
    index: true,
  },
  userId: {
    type: String,
    index: true,
  },
  details: {
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    affectedItems: [{
      type: String,
    }],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  impact: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'partial', 'reverted'],
    default: 'completed',
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
  sessionId: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ 'target.type': 1, 'target.id': 1 });
adminLogSchema.index({ impact: 1, createdAt: -1 });
adminLogSchema.index({ status: 1 });

// Static method to log admin action
adminLogSchema.statics.logAction = async function(actionData) {
  const log = new this(actionData);
  return await log.save();
};

// Static method to get logs by admin
adminLogSchema.statics.getByAdmin = async function(adminId, limit = 50) {
  return await this.find({ adminId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('jobId', 'status file.originalName')
    .populate('printerId', 'name location');
};

// Static method to get logs by action type
adminLogSchema.statics.getByAction = async function(action, limit = 100) {
  return await this.find({ action })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('jobId', 'status file.originalName')
    .populate('printerId', 'name location');
};

// Static method to get critical actions
adminLogSchema.statics.getCriticalActions = async function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return await this.find({
    impact: 'critical',
    createdAt: { $gte: cutoffDate }
  })
    .sort({ createdAt: -1 })
    .populate('jobId', 'status file.originalName')
    .populate('printerId', 'name location');
};

// Static method to get audit trail for specific target
adminLogSchema.statics.getAuditTrail = async function(targetType, targetId) {
  return await this.find({
    'target.type': targetType,
    'target.id': targetId
  })
    .sort({ createdAt: -1 })
    .populate('jobId', 'status file.originalName')
    .populate('printerId', 'name location');
};

// Virtual for formatted action description
adminLogSchema.virtual('actionDescription').get(function() {
  const actionMap = {
    'reprint': 'Initiated reprint',
    'cancel_job': 'Cancelled print job',
    'terminate_job': 'Terminated print job',
    'printer_maintenance': 'Performed printer maintenance',
    'user_action': 'User account action',
    'system_config': 'System configuration change',
    'user_suspend': 'Suspended user account',
    'user_activate': 'Activated user account',
    'printer_add': 'Added new printer',
    'printer_remove': 'Removed printer',
    'printer_update': 'Updated printer settings',
    'bulk_action': 'Performed bulk action',
    'data_export': 'Exported data',
    'settings_update': 'Updated system settings'
  };
  
  return actionMap[this.action] || this.action;
});

// Virtual for time since action
adminLogSchema.virtual('timeAgo').get(function() {
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

// Ensure virtual fields are serialized
adminLogSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('AdminLog', adminLogSchema);
