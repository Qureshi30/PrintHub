const express = require('express');
const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth, requireAdmin, requireStaff, validateUserAccess } = require('../middleware/authMiddleware');
const PrintJob = require('../models/PrintJob');
const Printer = require('../models/Printer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { deleteFromCloudinary } = require('../config/cloudinary');
const QueueManager = require('../services/queueManager');

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
        details: errors.array()
      }
    });
  }
  next();
};

// POST /api/print-jobs - Create print job
router.post('/',
  [
    body('clerkUserId').notEmpty().withMessage('User ID is required'),
    body('printerId').isMongoId().withMessage('Valid printer ID is required'),
    body('file.cloudinaryUrl').isURL().withMessage('Valid Cloudinary URL is required'),
    body('file.publicId').notEmpty().withMessage('Cloudinary public ID is required'),
    body('file.originalName').notEmpty().withMessage('Original filename is required'),
    body('file.format').notEmpty().withMessage('File format is required'),
    body('file.sizeKB').isNumeric().withMessage('File size must be a number'),
    body('settings.copies').optional().isInt({ min: 1, max: 100 }).withMessage('Copies must be between 1 and 100'),
    body('settings.color').optional().isBoolean(),
    body('settings.duplex').optional().isBoolean(),
    body('settings.paperType').optional().isIn(['A4', 'A3', 'Letter', 'Legal', 'Certificate']),
    body('priority').optional().isIn(['normal', 'high']).withMessage('Priority must be either "normal" or "high"'),
    requireAuth
  ],
  validateRequest,
  async (req, res) => {
    try {
      console.log('📝 Creating print job with data:', JSON.stringify(req.body, null, 2));
      const { clerkUserId, printerId, file, settings = {}, notes, cost, payment } = req.body;

      // Block admin users from uploading files
      if (req.user?.role === 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Admin users cannot upload files. Only staff members can upload.',
            code: 'ADMIN_UPLOAD_FORBIDDEN'
          }
        });
      }

      // Verify user can create jobs for this clerkUserId
      if (req.auth.userId !== clerkUserId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Cannot create jobs for other users',
            code: 'FORBIDDEN'
          }
        });
      }

      // Verify printer exists and is available
      const printer = await Printer.findById(printerId);
      if (!printer) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer not found',
            code: 'PRINTER_NOT_FOUND'
          }
        });
      }

      // For virtual printers (like Microsoft Print to PDF), automatically recover from offline status
      // if they were marked offline due to previous job failures
      if (!printer.isAvailable && printer.status === 'offline') {
        const isVirtualPrinter = printer.name.includes('Print to PDF') || 
                                 printer.name.includes('Microsoft') ||
                                 printer.name.includes('XPS');
        
        if (isVirtualPrinter && printer.isActive) {
          console.log(`🔄 Auto-recovering virtual printer: ${printer.name}`);
          printer.status = 'online';
          await printer.save();
        }
      }

      if (!printer.isAvailable) {
        console.error(`❌ Printer unavailable: ${printer.name}`, {
          status: printer.status,
          isActive: printer.isActive,
          queueLength: printer.queueLength,
          maxQueueSize: printer.settings.maxQueueSize
        });
        return res.status(400).json({
          success: false,
          error: {
            message: `Printer is not available. Status: ${printer.status}, Active: ${printer.isActive}`,
            code: 'PRINTER_UNAVAILABLE'
          }
        });
      }

      // Determine priority based on user role
      const priority = req.user?.role === 'staff' ? 'high' : 'normal';

      // Create print job
      const printJob = new PrintJob({
        clerkUserId,
        printerId,
        file,
        settings: {
          pages: settings.pages || 'all',
          copies: settings.copies || 1,
          color: settings.color || false,
          duplex: settings.duplex || false,
          paperType: settings.paperType || 'A4'
        },
        priority, // Set priority based on user role
        notes,
        status: 'pending',
        // Use cost from request if provided, otherwise calculate
        cost: cost || {
          totalCost: 0 // Will be calculated below if not provided
        },
        // Use payment info from request if provided
        payment: payment || {
          status: 'unpaid',
          method: 'student_credit'
        }
      });

      // Only calculate cost if not provided from frontend
      if (!cost || !cost.totalCost) {
        const estimatedCost = printJob.estimatedTotalCost;
        printJob.cost.totalCost = estimatedCost;
        printJob.cost.baseCost = estimatedCost * 0.8;
        printJob.cost.paperCost = estimatedCost * 0.2;
        printJob.cost.colorCost = 0;
      }

      console.log('💰 Print job cost:', {
        totalCost: printJob.cost.totalCost,
        paymentStatus: printJob.payment.status,
        paymentMethod: printJob.payment.method
      });

      await printJob.save();

      // Add to print queue using QueueManager
      let queuePosition = null;
      let queueError = null;

      try {
        const queueItem = await QueueManager.enqueue(printJob._id);
        queuePosition = queueItem.position;
        console.log(`✅ Print job ${printJob._id} added to queue at position ${queuePosition}`);
      } catch (error) {
        queueError = error.message;
        console.error(`❌ Failed to add print job ${printJob._id} to queue:`, error.message);
        // Don't fail the entire operation if queue addition fails
      }

      // Update printer queue (legacy support)
      try {
        printer.addToQueue(printJob._id);
        await printer.save();
      } catch (printerError) {
        console.warn('⚠️ Failed to update printer queue:', printerError);
      }

      // Update user statistics (with timeout and error handling)
      try {
        await User.findOneAndUpdate(
          { clerkUserId },
          { $inc: { 'statistics.totalJobs': 1 } }
        );
      } catch (userUpdateError) {
        console.warn('⚠️ Failed to update user statistics:', userUpdateError);
        // Don't fail the entire operation if user stats update fails
      }

      // Create notification (with timeout and error handling)
      try {
        const queueMessage = queuePosition
          ? `Your print job for "${file.originalName}" has been added to the queue at position ${queuePosition}`
          : `Your print job for "${file.originalName}" has been added to the queue`;

        await Notification.createNotification({
          clerkUserId,
          jobId: printJob._id,
          type: 'queue_update',
          title: 'Print Job Created',
          message: queueMessage,
          metadata: {
            printerId,
            queuePosition: queuePosition || printer.queueLength,
            cost: estimatedCost
          }
        });
      } catch (notificationError) {
        console.warn('⚠️ Failed to create notification:', notificationError);
        // Don't fail the entire operation if notification creation fails
      }

      // Populate printer info for response
      try {
        await printJob.populate('printerId', 'name location status');
      } catch (populateError) {
        console.warn('⚠️ Failed to populate printer info:', populateError);
        // Continue without populated data
      }

      res.status(201).json({
        success: true,
        data: {
          ...printJob.toObject(),
          queue: {
            position: queuePosition,
            addedToQueue: queuePosition !== null,
            queueError: queueError
          }
        },
        message: queuePosition
          ? `Print job created and added to queue at position ${queuePosition}`
          : 'Print job created (queue addition failed)'
      });
    } catch (error) {
      console.error('❌ Create print job error:', error);

      // Handle MongoDB connection errors
      if (error.name === 'MongoTimeoutError' || error.name === 'MongoNetworkError' ||
        error.message.includes('buffering timed out') || error.message.includes('ENOTFOUND') ||
        error.message.includes('connection')) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'Database connection issue. Please try again later.',
            code: 'DATABASE_CONNECTION_ERROR'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create print job',
          code: 'CREATE_ERROR'
        }
      });
    }
  }
);

// GET /api/print-jobs/user/:clerkUserId - Get user's print jobs
router.get('/user/:clerkUserId',
  [
    param('clerkUserId').notEmpty().withMessage('User ID is required'),
    query('status').optional().isIn(['pending', 'queued', 'printing', 'completed', 'failed', 'cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    requireAuth,
    validateUserAccess
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { clerkUserId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { clerkUserId };
      if (status) filter.status = status;

      const [jobs, total] = await Promise.all([
        PrintJob.find(filter)
          .populate('printerId', 'name location status')
          .sort({ priority: -1, createdAt: 1 })
          .skip(skip)
          .limit(Number.parseInt(limit, 10)),
        PrintJob.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            page: Number.parseInt(page, 10),
            limit: Number.parseInt(limit, 10),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get user print jobs error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch print jobs',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// GET /api/print-jobs/:id - Get specific print job
router.get('/:id',
  [
    param('id').isMongoId().withMessage('Valid job ID is required'),
    requireAuth
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const job = await PrintJob.findById(id)
        .populate('printerId', 'name location status queue');

      if (!job) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Print job not found',
            code: 'JOB_NOT_FOUND'
          }
        });
      }

      // Check access permissions
      if (job.clerkUserId !== req.auth.userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied to this print job',
            code: 'FORBIDDEN'
          }
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error('❌ Get print job error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch print job',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// PUT /api/print-jobs/:id/cancel - Cancel print job
router.put('/:id/cancel',
  [
    param('id').isMongoId().withMessage('Valid job ID is required'),
    requireAuth
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const job = await PrintJob.findById(id).populate('printerId');

      if (!job) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Print job not found',
            code: 'JOB_NOT_FOUND'
          }
        });
      }

      // Check access permissions
      if (job.clerkUserId !== req.auth.userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied to this print job',
            code: 'FORBIDDEN'
          }
        });
      }

      // Check if job can be cancelled
      if (!['pending', 'queued'].includes(job.status)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Job cannot be cancelled in current status',
            code: 'INVALID_STATUS'
          }
        });
      }

      // Remove from printer queue
      if (job.printerId) {
        job.printerId.removeFromQueue(job._id);
        await job.printerId.save();
      }

      // Update job status
      job.status = 'cancelled';
      await job.save();

      // Create notification
      await Notification.createNotification({
        clerkUserId: job.clerkUserId,
        jobId: job._id,
        type: 'queue_update',
        title: 'Print Job Cancelled',
        message: `Your print job for "${job.file.originalName}" has been cancelled`,
      });

      res.json({
        success: true,
        data: job,
        message: 'Print job cancelled successfully'
      });
    } catch (error) {
      console.error('❌ Cancel print job error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to cancel print job',
          code: 'CANCEL_ERROR'
        }
      });
    }
  }
);

// DELETE /api/print-jobs/:id - Delete print job (Admin only)
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Valid job ID is required'),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const job = await PrintJob.findById(id).populate('printerId');

      if (!job) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Print job not found',
            code: 'JOB_NOT_FOUND'
          }
        });
      }

      // Remove from printer queue if needed
      if (job.printerId && ['pending', 'queued'].includes(job.status)) {
        job.printerId.removeFromQueue(job._id);
        await job.printerId.save();
      }

      // Delete file from Cloudinary
      try {
        await deleteFromCloudinary(job.file.publicId);
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary delete error:', cloudinaryError);
        // Continue with job deletion even if Cloudinary fails
      }

      // Delete job
      await PrintJob.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Print job deleted successfully'
      });
    } catch (error) {
      console.error('❌ Delete print job error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete print job',
          code: 'DELETE_ERROR'
        }
      });
    }
  }
);

// GET /api/print-jobs - Get all print jobs (Admin only)
router.get('/',
  requireAuth,
  requireAdmin,
  [
    query('status').optional().isIn(['pending', 'queued', 'in-progress', 'printing', 'completed', 'failed', 'cancelled', 'terminated']),
    query('printerId').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { status, printerId, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (status) filter.status = status;
      if (printerId) filter.printerId = printerId;

      const [jobs, total] = await Promise.all([
        PrintJob.find(filter)
          .populate('printerId', 'name location status')
          .sort({ priority: -1, createdAt: 1 })
          .skip(skip)
          .limit(Number.parseInt(limit, 10)),
        PrintJob.countDocuments(filter)
      ]);

      // Fetch user data for each job
      const jobsWithUserData = await Promise.all(jobs.map(async (job) => {
        const jobObj = job.toObject();
        try {
          const user = await User.findOne({ clerkUserId: job.clerkUserId })
            .select('profile.firstName profile.lastName profile.email')
            .lean();
          
          if (user && user.profile) {
            jobObj.userName = user.profile.firstName 
              ? `${user.profile.firstName}${user.profile.lastName ? ' ' + user.profile.lastName : ''}`
              : null;
            jobObj.userEmail = user.profile.email || null;
          }
        } catch (err) {
          console.warn(`⚠️ Failed to fetch user data for job ${job._id}:`, err);
        }
        return jobObj;
      }));

      res.json({
        success: true,
        data: {
          jobs: jobsWithUserData,
          pagination: {
            page: Number.parseInt(page, 10),
            limit: Number.parseInt(limit, 10),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get all print jobs error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch print jobs',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

module.exports = router;
