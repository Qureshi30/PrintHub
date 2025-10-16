const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const PrinterError = require('../models/PrinterError');
const Printer = require('../models/Printer');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation failed:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }
  next();
};

/**
 * @route   GET /api/printer-errors
 * @desc    Get all printer errors with filtering and pagination
 * @access  Admin
 */
router.get(
  '/',
  requireAuth,
  requireAdmin,
  [
    query('status').optional().isIn(['unresolved', 'in_progress', 'resolved', 'ignored']),
    query('errorType').optional().isString(),
    query('printerName').optional().isString(),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        status,
        errorType,
        printerName,
        priority,
        page = 1,
        limit = 20,
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = req.query;

      // Build filter
      const filter = {};
      if (status) filter.status = status;
      if (errorType) filter.errorType = errorType;
      if (printerName) filter.printerName = new RegExp(printerName, 'i');
      if (priority) filter.priority = priority;

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [errors, total] = await Promise.all([
        PrinterError.find(filter)
          .populate('printerId', 'name location model systemInfo')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        PrinterError.countDocuments(filter),
      ]);

      // Calculate statistics
      const stats = {
        total,
        unresolved: await PrinterError.countDocuments({ ...filter, status: 'unresolved' }),
        inProgress: await PrinterError.countDocuments({ ...filter, status: 'in_progress' }),
        resolved: await PrinterError.countDocuments({ ...filter, status: 'resolved' }),
      };

      res.json({
        success: true,
        data: {
          errors,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalErrors: total,
            perPage: limit,
          },
          stats,
        },
      });
    } catch (error) {
      console.error('Error fetching printer errors:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch printer errors',
          details: error.message,
        },
      });
    }
  }
);

/**
 * @route   GET /api/printer-errors/stats
 * @desc    Get error statistics
 * @access  Admin
 */
router.get(
  '/stats',
  requireAuth,
  requireAdmin,
  [query('days').optional().isInt({ min: 1, max: 365 }).toInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { days = 7 } = req.query;

      const stats = await PrinterError.getStats(days);

      // Get overall counts
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [totalErrors, unresolvedErrors, printerBreakdown] = await Promise.all([
        PrinterError.countDocuments({ timestamp: { $gte: startDate } }),
        PrinterError.countDocuments({ status: 'unresolved', timestamp: { $gte: startDate } }),
        PrinterError.aggregate([
          { $match: { timestamp: { $gte: startDate } } },
          {
            $group: {
              _id: '$printerName',
              count: { $sum: 1 },
              unresolved: {
                $sum: { $cond: [{ $eq: ['$status', 'unresolved'] }, 1, 0] },
              },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          period: `Last ${days} days`,
          totalErrors,
          unresolvedErrors,
          resolvedErrors: totalErrors - unresolvedErrors,
          errorsByType: stats,
          errorsByPrinter: printerBreakdown,
        },
      });
    } catch (error) {
      console.error('Error fetching error statistics:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch error statistics',
          details: error.message,
        },
      });
    }
  }
);

/**
 * @route   GET /api/printer-errors/recent-activity
 * @desc    Get recent printer errors for dashboard (unresolved and in-progress only)
 * @access  Admin
 */
router.get(
  '/recent-activity',
  requireAuth,
  requireAdmin,
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  validateRequest,
  async (req, res) => {
    try {
      const limit = Number.parseInt(req.query.limit, 10) || 10;

      console.log(`📊 Fetching recent errors (limit: ${limit})...`);

      const recentErrors = await PrinterError.find({
        status: { $in: ['unresolved', 'in_progress'] },
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('printerId', 'name location model')
        .lean();

      console.log(`✅ Found ${recentErrors.length} recent errors`);

      res.json({
        success: true,
        data: recentErrors,
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch recent activity',
          details: error.message,
        },
      });
    }
  }
);

/**
 * @route   GET /api/printer-errors/:id
 * @desc    Get single printer error by ID
 * @access  Admin
 */
router.get(
  '/:id',
  requireAuth,
  requireAdmin,
  [param('id').isMongoId()],
  validateRequest,
  async (req, res) => {
    try {
      const error = await PrinterError.findById(req.params.id)
        .populate('printerId', 'name location model systemInfo capabilities status');

      if (!error) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer error not found',
            code: 'ERROR_NOT_FOUND',
          },
        });
      }

      res.json({
        success: true,
        data: error,
      });
    } catch (error) {
      console.error('Error fetching printer error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch printer error',
          details: error.message,
        },
      });
    }
  }
);

/**
 * @route   POST /api/printer-errors
 * @desc    Create a new printer error
 * @access  Admin
 */
router.post(
  '/',
  requireAuth,
  [
    body('printerName').trim().notEmpty().withMessage('Printer name is required'),
    body('printerId').optional().isMongoId(),
    body('errorType')
      .trim()
      .notEmpty()
      .isIn([
        'Low Paper',
        'Out of Paper',
        'Low Toner',
        'Out of Toner',
        'Paper Jam',
        'Door Open',
        'Offline',
        'Service Requested',
        'Hardware Error',
        'Communication Error',
        'Print Queue Full',
        'Driver Error',
        'Other',
      ])
      .withMessage('Invalid error type'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('metadata').optional().isObject(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { printerName, printerId, errorType, description, priority, metadata } = req.body;

      // If printerId is provided, verify it exists
      let printerDoc = null;
      if (printerId) {
        printerDoc = await Printer.findById(printerId);
        if (!printerDoc) {
          return res.status(404).json({
            success: false,
            error: {
              message: 'Printer not found',
              code: 'PRINTER_NOT_FOUND',
            },
          });
        }
      } else {
        // Try to find printer by name
        printerDoc = await Printer.findOne({ name: new RegExp(`^${printerName}$`, 'i') });
      }

      const errorData = {
        printerName,
        printerId: printerDoc ? printerDoc._id : null,
        errorType,
        description,
        priority,
        metadata: {
          ...metadata,
          location: printerDoc?.location,
          ipAddress: printerDoc?.systemInfo?.ipAddress,
        },
      };

      const printerError = await PrinterError.create(errorData);

      // Populate the printer info before returning
      await printerError.populate('printerId', 'name location model');

      console.log(`✅ Printer error logged: ${errorType} - ${printerName}`);

      res.status(201).json({
        success: true,
        message: 'Printer error logged successfully',
        data: printerError,
      });
    } catch (error) {
      console.error('Error creating printer error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create printer error',
          details: error.message,
        },
      });
    }
  }
);

/**
 * @route   PATCH /api/printer-errors/:id/status
 * @desc    Update printer error status
 * @access  Admin
 */
router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  [
    param('id').isMongoId(),
    body('status').isIn(['unresolved', 'in_progress', 'resolved', 'ignored']),
    body('resolvedBy').optional().isString(),
    body('resolutionNotes').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { status, resolvedBy, resolutionNotes } = req.body;

      const printerError = await PrinterError.findById(req.params.id);

      if (!printerError) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer error not found',
            code: 'ERROR_NOT_FOUND',
          },
        });
      }

      printerError.status = status;

      if (status === 'resolved') {
        printerError.resolvedAt = new Date();
        printerError.resolvedBy = resolvedBy || 'Admin';
        if (resolutionNotes) {
          printerError.resolutionNotes = resolutionNotes;
        }

        // Update printer status to online if all errors are resolved
        if (printerError.printerId) {
          const remainingErrors = await PrinterError.countDocuments({
            printerId: printerError.printerId,
            status: { $in: ['unresolved', 'in_progress'] },
            _id: { $ne: printerError._id },
          });

          if (remainingErrors === 0) {
            await Printer.findByIdAndUpdate(printerError.printerId, {
              status: 'online',
            });
          }
        }
      } else if (status === 'in_progress') {
        // When error is in progress, set printer to online (but error shows in-progress)
        if (printerError.printerId) {
          await Printer.findByIdAndUpdate(printerError.printerId, {
            status: 'online',
          });
        }
      }

      await printerError.save();

      res.json({
        success: true,
        message: 'Error status updated successfully',
        data: printerError,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update error status',
          details: error.message,
        },
      });
    }
  }
);

/**
 * @route   DELETE /api/printer-errors/:id
 * @desc    Delete a printer error
 * @access  Admin
 */
router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  [param('id').isMongoId()],
  validateRequest,
  async (req, res) => {
    try {
      const printerError = await PrinterError.findByIdAndDelete(req.params.id);

      if (!printerError) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer error not found',
            code: 'ERROR_NOT_FOUND',
          },
        });
      }

      res.json({
        success: true,
        message: 'Printer error deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting printer error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete printer error',
          details: error.message,
        },
      });
    }
  }
);

/**
 * @route   DELETE /api/printer-errors
 * @desc    Bulk delete resolved errors older than specified days
 * @access  Admin
 */
router.delete(
  '/',
  requireAuth,
  requireAdmin,
  [query('days').optional().isInt({ min: 1 }).toInt()],
  validateRequest,
  async (req, res) => {
    try {
      const { days = 30 } = req.query;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await PrinterError.deleteMany({
        status: 'resolved',
        resolvedAt: { $lt: cutoffDate },
      });

      res.json({
        success: true,
        message: `Deleted ${result.deletedCount} resolved errors older than ${days} days`,
        data: {
          deletedCount: result.deletedCount,
        },
      });
    } catch (error) {
      console.error('Error bulk deleting printer errors:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete printer errors',
          details: error.message,
        },
      });
    }
  }
);

/**
 * @route   POST /api/printer-errors/:id/in-progress
 * @desc    Mark error as in progress
 * @access  Admin
 */
router.post(
  '/:id/in-progress',
  requireAuth,
  requireAdmin,
  [param('id').isMongoId()],
  validateRequest,
  async (req, res) => {
    try {
      const printerError = await PrinterError.findById(req.params.id);

      if (!printerError) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer error not found',
            code: 'ERROR_NOT_FOUND',
          },
        });
      }

      printerError.status = 'in_progress';
      printerError.inProgressAt = new Date();
      await printerError.save();

      // Set printer to online when work is in progress (admin is working on it)
      // Find by printer name since error might not have printerId
      await Printer.findOneAndUpdate(
        { name: printerError.printerName },
        { status: 'online', lastChecked: new Date() }
      );

      res.json({
        success: true,
        message: 'Error marked as in progress',
        data: printerError,
      });
    } catch (error) {
      console.error('Error marking as in progress:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update error status',
          details: error.message,
        },
      });
    }
  }
);

/**
 * @route   POST /api/printer-errors/:id/resolve
 * @desc    Mark error as resolved
 * @access  Admin
 */
router.post(
  '/:id/resolve',
  requireAuth,
  requireAdmin,
  [
    param('id').isMongoId(),
    body('resolvedBy').optional().isString(),
    body('resolutionNotes').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { resolvedBy, resolutionNotes } = req.body;

      const printerError = await PrinterError.findById(req.params.id);

      if (!printerError) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer error not found',
            code: 'ERROR_NOT_FOUND',
          },
        });
      }

      printerError.status = 'resolved';
      printerError.resolvedAt = new Date();
      printerError.resolvedBy = resolvedBy || 'Admin';
      if (resolutionNotes) {
        printerError.resolutionNotes = resolutionNotes;
      }

      await printerError.save();

      // Update printer status to online if all errors are resolved
      // Check by printerName since errors might not have printerId
      const remainingErrors = await PrinterError.countDocuments({
        printerName: printerError.printerName,
        status: { $in: ['unresolved', 'in_progress'] },
        _id: { $ne: printerError._id },
      });

      if (remainingErrors === 0) {
        // Find printer by name and update status
        await Printer.findOneAndUpdate(
          { name: printerError.printerName },
          { status: 'online', lastChecked: new Date() }
        );
      }

      res.json({
        success: true,
        message: 'Error resolved successfully',
        data: printerError,
      });
    } catch (error) {
      console.error('Error resolving error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to resolve error',
          details: error.message,
        },
      });
    }
  }
);

module.exports = router;
