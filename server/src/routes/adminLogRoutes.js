const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { requireAdmin } = require('../middleware/authMiddleware');
const AdminLog = require('../models/AdminLog');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

// POST /api/admin-logs - Create admin log entry
router.post('/',
  [
    body('action').isIn([
      'reprint', 'cancel_job', 'printer_maintenance', 'user_action',
      'system_config', 'user_suspend', 'user_activate', 'printer_add',
      'printer_remove', 'printer_update', 'bulk_action', 'data_export',
      'settings_update'
    ]).withMessage('Invalid action type'),
    body('target.type').isIn(['user', 'printer', 'print_job', 'system']).withMessage('Invalid target type'),
    body('target.id').notEmpty().withMessage('Target ID is required'),
    body('target.name').optional().trim(),
    body('details.description').notEmpty().trim().isLength({ max: 1000 }).withMessage('Description is required and must be under 1000 characters'),
    body('details.reason').optional().trim().isLength({ max: 500 }),
    body('impact').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('jobId').optional().isMongoId(),
    body('printerId').optional().isMongoId(),
    body('userId').optional().notEmpty(),
    body('notes').optional().trim().isLength({ max: 1000 }),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const logData = {
        ...req.body,
        adminId: req.auth.userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      };

      const adminLog = await AdminLog.logAction(logData);

      res.status(201).json({
        success: true,
        data: adminLog,
        message: 'Admin action logged successfully'
      });
    } catch (error) {
      console.error('❌ Create admin log error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to log admin action',
          code: 'LOG_ERROR'
        }
      });
    }
  }
);

// GET /api/admin-logs - Get admin logs
router.get('/',
  [
    query('adminId').optional().notEmpty(),
    query('action').optional().isIn([
      'reprint', 'cancel_job', 'printer_maintenance', 'user_action',
      'system_config', 'user_suspend', 'user_activate', 'printer_add',
      'printer_remove', 'printer_update', 'bulk_action', 'data_export',
      'settings_update'
    ]),
    query('impact').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('targetType').optional().isIn(['user', 'printer', 'print_job', 'system']),
    query('targetId').optional().notEmpty(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        adminId,
        action,
        impact,
        targetType,
        targetId,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;
      
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (adminId) filter.adminId = adminId;
      if (action) filter.action = action;
      if (impact) filter.impact = impact;
      if (targetType) filter['target.type'] = targetType;
      if (targetId) filter['target.id'] = targetId;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const [logs, total] = await Promise.all([
        AdminLog.find(filter)
          .populate('jobId', 'status file.originalName clerkUserId')
          .populate('printerId', 'name location status')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        AdminLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get admin logs error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch admin logs',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// GET /api/admin-logs/admin/:adminId - Get logs by specific admin
router.get('/admin/:adminId',
  [
    param('adminId').notEmpty().withMessage('Admin ID is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { adminId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const logs = await AdminLog.getByAdmin(adminId, limit);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('❌ Get admin logs by admin error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch admin logs',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// GET /api/admin-logs/action/:action - Get logs by action type
router.get('/action/:action',
  [
    param('action').isIn([
      'reprint', 'cancel_job', 'printer_maintenance', 'user_action',
      'system_config', 'user_suspend', 'user_activate', 'printer_add',
      'printer_remove', 'printer_update', 'bulk_action', 'data_export',
      'settings_update'
    ]).withMessage('Invalid action type'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { action } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const logs = await AdminLog.getByAction(action, limit);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('❌ Get admin logs by action error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch admin logs',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// GET /api/admin-logs/critical - Get critical actions
router.get('/critical',
  [
    query('days').optional().isInt({ min: 1, max: 365 }),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;

      const logs = await AdminLog.getCriticalActions(days);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('❌ Get critical admin logs error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch critical admin logs',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// GET /api/admin-logs/audit/:targetType/:targetId - Get audit trail for specific target
router.get('/audit/:targetType/:targetId',
  [
    param('targetType').isIn(['user', 'printer', 'print_job', 'system']).withMessage('Invalid target type'),
    param('targetId').notEmpty().withMessage('Target ID is required'),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { targetType, targetId } = req.params;

      const logs = await AdminLog.getAuditTrail(targetType, targetId);

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error('❌ Get audit trail error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch audit trail',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// GET /api/admin-logs/stats - Get admin activity statistics
router.get('/stats',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      const [
        totalLogs,
        actionStats,
        impactStats,
        adminStats,
        recentCritical
      ] = await Promise.all([
        AdminLog.countDocuments(dateFilter),
        AdminLog.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        AdminLog.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$impact', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        AdminLog.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$adminId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        AdminLog.countDocuments({
          ...dateFilter,
          impact: 'critical',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        })
      ]);

      res.json({
        success: true,
        data: {
          totalLogs,
          actionBreakdown: actionStats,
          impactBreakdown: impactStats,
          topAdmins: adminStats,
          recentCriticalActions: recentCritical
        }
      });
    } catch (error) {
      console.error('❌ Get admin stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch admin statistics',
          code: 'STATS_ERROR'
        }
      });
    }
  }
);

module.exports = router;
