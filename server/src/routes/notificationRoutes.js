const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth, validateUserAccess } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

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

// GET /api/notifications/user/:clerkUserId - Get user notifications
router.get('/user/:clerkUserId',
  [
    param('clerkUserId').notEmpty().withMessage('User ID is required'),
    query('read').optional().isBoolean(),
    query('type').optional().isIn(['job_completed', 'job_failed', 'reprint', 'queue_update', 'maintenance', 'system', 'payment']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    requireAuth,
    validateUserAccess
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { clerkUserId } = req.params;
      const { read, type, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { clerkUserId };
      if (read !== undefined) filter.read = read;
      if (type) filter.type = type;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .populate('jobId', 'file.originalName status')
          .populate('metadata.printerId', 'name location')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Notification.countDocuments(filter),
        Notification.getUnreadCount(clerkUserId)
      ]);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch notifications',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read',
  [
    param('id').isMongoId().withMessage('Valid notification ID is required'),
    requireAuth
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const notification = await Notification.markAsRead(id, req.auth.userId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found or access denied',
            code: 'NOTIFICATION_NOT_FOUND'
          }
        });
      }

      res.json({
        success: true,
        data: notification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('❌ Mark notification read error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to mark notification as read',
          code: 'UPDATE_ERROR'
        }
      });
    }
  }
);

// PUT /api/notifications/user/:clerkUserId/read-all - Mark all notifications as read
router.put('/user/:clerkUserId/read-all',
  [
    param('clerkUserId').notEmpty().withMessage('User ID is required'),
    requireAuth,
    validateUserAccess
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { clerkUserId } = req.params;

      const result = await Notification.markAllAsRead(clerkUserId);

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        },
        message: `${result.modifiedCount} notifications marked as read`
      });
    } catch (error) {
      console.error('❌ Mark all notifications read error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to mark all notifications as read',
          code: 'UPDATE_ERROR'
        }
      });
    }
  }
);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Valid notification ID is required'),
    requireAuth
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        clerkUserId: req.auth.userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Notification not found or access denied',
            code: 'NOTIFICATION_NOT_FOUND'
          }
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete notification error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete notification',
          code: 'DELETE_ERROR'
        }
      });
    }
  }
);

// POST /api/notifications - Create notification (Internal use)
router.post('/',
  [
    body('clerkUserId').notEmpty().withMessage('User ID is required'),
    body('type').isIn(['job_completed', 'job_failed', 'reprint', 'queue_update', 'maintenance', 'system', 'payment']).withMessage('Invalid notification type'),
    body('title').notEmpty().trim().isLength({ max: 100 }).withMessage('Title is required and must be under 100 characters'),
    body('message').notEmpty().trim().isLength({ max: 500 }).withMessage('Message is required and must be under 500 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('jobId').optional().isMongoId().withMessage('Invalid job ID'),
    body('metadata').optional().isObject(),
    requireAuth
  ],
  validateRequest,
  async (req, res) => {
    try {
      const notificationData = req.body;

      // Only admins or the system can create notifications for other users
      if (notificationData.clerkUserId !== req.auth.userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Cannot create notifications for other users',
            code: 'FORBIDDEN'
          }
        });
      }

      const notification = await Notification.createNotification(notificationData);

      res.status(201).json({
        success: true,
        data: notification,
        message: 'Notification created successfully'
      });
    } catch (error) {
      console.error('❌ Create notification error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create notification',
          code: 'CREATE_ERROR'
        }
      });
    }
  }
);

// GET /api/notifications/user/:clerkUserId/unread-count - Get unread notification count
router.get('/user/:clerkUserId/unread-count',
  [
    param('clerkUserId').notEmpty().withMessage('User ID is required'),
    requireAuth,
    validateUserAccess
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { clerkUserId } = req.params;

      const unreadCount = await Notification.getUnreadCount(clerkUserId);

      res.json({
        success: true,
        data: {
          unreadCount
        }
      });
    } catch (error) {
      console.error('❌ Get unread count error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch unread count',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// DELETE /api/notifications/user/:clerkUserId/cleanup - Clean up old read notifications
router.delete('/user/:clerkUserId/cleanup',
  [
    param('clerkUserId').notEmpty().withMessage('User ID is required'),
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
    requireAuth,
    validateUserAccess
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { clerkUserId } = req.params;
      const days = parseInt(req.query.days) || 30;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await Notification.deleteMany({
        clerkUserId,
        read: true,
        createdAt: { $lt: cutoffDate }
      });

      res.json({
        success: true,
        data: {
          deletedCount: result.deletedCount
        },
        message: `${result.deletedCount} old notifications cleaned up`
      });
    } catch (error) {
      console.error('❌ Cleanup notifications error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to cleanup notifications',
          code: 'CLEANUP_ERROR'
        }
      });
    }
  }
);

module.exports = router;
