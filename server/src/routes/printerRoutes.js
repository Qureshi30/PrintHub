const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const Printer = require('../models/Printer');
const PrintJob = require('../models/PrintJob');

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

// GET /api/printers/test - Test printers without auth (debug only)
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test printer fetch (no auth required)');
    
    const printers = await Printer.find({ isActive: true, status: 'online' })
      .select('name status location isActive capabilities queue')
      .sort({ name: 1 });

    console.log('✅ Test printer fetch success:', printers.length);

    res.json({
      success: true,
      data: printers,
      message: 'Test fetch successful'
    });
  } catch (error) {
    console.error('❌ Test printer fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: 'TEST_FETCH_ERROR'
      }
    });
  }
});

// GET /api/printers - Get all printers
router.get('/',
  requireAuth,
  async (req, res) => {
    try {
      console.log('🖨️ Fetching printers - Auth user:', req.auth?.userId);
      console.log('🔍 Query params:', req.query);
      
      const { status, location } = req.query;

      // Build filter
      const filter = { isActive: true };
      if (status) {
        filter.status = status;
        console.log('🔍 Filtering by status:', status);
      }
      if (location) filter.location = { $regex: location, $options: 'i' };

      console.log('🔍 Printer filter:', filter);

      // Simplified query without populate to avoid potential issues
      const printers = await Printer.find(filter)
        .select('name status location isActive capabilities costPerPage queue')
        .sort({ name: 1 })
        .lean(); // Use lean() for better performance

      console.log('✅ Found printers:', printers.length);

      res.json({
        success: true,
        data: printers
      });
    } catch (error) {
      console.error('❌ Get printers error:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: {
          message: `Failed to fetch printers: ${error.message}`,
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// GET /api/printers/available - Get available printers
router.get('/available',
  async (req, res) => {
    try {
      const printers = await Printer.find({
        status: 'online',
        isActive: true
      })
        .populate('queue', 'status')
        .sort({ name: 1 });

      // Filter to only truly available printers
      const availablePrinters = printers.filter(printer => printer.isAvailable);

      res.json({
        success: true,
        data: availablePrinters
      });
    } catch (error) {
      console.error('❌ Get available printers error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch available printers',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// GET /api/printers/:id - Get specific printer
router.get('/:id',
  [
    param('id').isMongoId().withMessage('Valid printer ID is required')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const printer = await Printer.findById(id)
        .populate('queue', 'status clerkUserId file.originalName createdAt estimatedCompletionTime');

      if (!printer) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer not found',
            code: 'PRINTER_NOT_FOUND'
          }
        });
      }

      res.json({
        success: true,
        data: printer
      });
    } catch (error) {
      console.error('❌ Get printer error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch printer',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// POST /api/printers - Create new printer (Admin only)
router.post('/',
  [
    body('name').notEmpty().trim().withMessage('Printer name is required'),
    body('location').notEmpty().trim().withMessage('Location is required'),
    body('description').optional().trim(),
    body('specifications.maxPaperSize').optional().isIn(['A4', 'A3', 'Letter', 'Legal', 'Certificate']),
    body('specifications.supportedPaperTypes').optional().isArray(),
    body('specifications.colorSupport').optional().isBoolean(),
    body('specifications.duplexSupport').optional().isBoolean(),
    body('specifications.maxCopies').optional().isInt({ min: 1, max: 1000 }),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const printerData = req.body;

      // Check if printer name already exists
      const existingPrinter = await Printer.findOne({ name: printerData.name });
      if (existingPrinter) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Printer with this name already exists',
            code: 'DUPLICATE_NAME'
          }
        });
      }

      const printer = new Printer(printerData);
      await printer.save();

      res.status(201).json({
        success: true,
        data: printer,
        message: 'Printer created successfully'
      });
    } catch (error) {
      console.error('❌ Create printer error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create printer',
          code: 'CREATE_ERROR'
        }
      });
    }
  }
);

// PUT /api/printers/:id - Update printer (Admin only)
router.put('/:id',
  [
    param('id').isMongoId().withMessage('Valid printer ID is required'),
    body('name').optional().notEmpty().trim().withMessage('Printer name cannot be empty'),
    body('location').optional().notEmpty().trim().withMessage('Location cannot be empty'),
    body('status').optional().isIn(['online', 'offline', 'maintenance', 'busy']),
    body('specifications.maxPaperSize').optional().isIn(['A4', 'A3', 'Letter', 'Legal', 'Certificate']),
    body('specifications.supportedPaperTypes').optional().isArray(),
    body('specifications.colorSupport').optional().isBoolean(),
    body('specifications.duplexSupport').optional().isBoolean(),
    body('supplies.inkLevel.black').optional().isFloat({ min: 0, max: 100 }),
    body('supplies.inkLevel.cyan').optional().isFloat({ min: 0, max: 100 }),
    body('supplies.inkLevel.magenta').optional().isFloat({ min: 0, max: 100 }),
    body('supplies.inkLevel.yellow').optional().isFloat({ min: 0, max: 100 }),
    body('supplies.paperLevel').optional().isFloat({ min: 0, max: 100 }),
    body('supplies.tonerLevel').optional().isFloat({ min: 0, max: 100 }),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // If updating name, check for duplicates
      if (updates.name) {
        const existingPrinter = await Printer.findOne({ 
          name: updates.name, 
          _id: { $ne: id } 
        });
        if (existingPrinter) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Printer with this name already exists',
              code: 'DUPLICATE_NAME'
            }
          });
        }
      }

      // Update lastChecked if status or supplies are being updated
      if (updates.status || updates.supplies) {
        updates.lastChecked = new Date();
      }

      const printer = await Printer.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).populate('queue', 'status file.originalName');

      if (!printer) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer not found',
            code: 'PRINTER_NOT_FOUND'
          }
        });
      }

      res.json({
        success: true,
        data: printer,
        message: 'Printer updated successfully'
      });
    } catch (error) {
      console.error('❌ Update printer error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update printer',
          code: 'UPDATE_ERROR'
        }
      });
    }
  }
);

// DELETE /api/printers/:id - Delete printer (Admin only)
router.delete('/:id',
  [
    param('id').isMongoId().withMessage('Valid printer ID is required'),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const printer = await Printer.findById(id);

      if (!printer) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer not found',
            code: 'PRINTER_NOT_FOUND'
          }
        });
      }

      // Check if printer has pending jobs
      const pendingJobs = await PrintJob.countDocuments({
        printerId: id,
        status: { $in: ['pending', 'queued', 'printing'] }
      });

      if (pendingJobs > 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Cannot delete printer with ${pendingJobs} pending jobs`,
            code: 'HAS_PENDING_JOBS'
          }
        });
      }

      // Soft delete - mark as inactive instead of deleting
      printer.isActive = false;
      printer.status = 'offline';
      await printer.save();

      res.json({
        success: true,
        message: 'Printer deactivated successfully'
      });
    } catch (error) {
      console.error('❌ Delete printer error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete printer',
          code: 'DELETE_ERROR'
        }
      });
    }
  }
);

// POST /api/printers/:id/maintenance - Set printer to maintenance mode (Admin only)
router.post('/:id/maintenance',
  [
    param('id').isMongoId().withMessage('Valid printer ID is required'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
    body('estimatedDuration').optional().isInt({ min: 1 }).withMessage('Duration must be positive'),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes, estimatedDuration } = req.body;

      const printer = await Printer.findById(id);

      if (!printer) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer not found',
            code: 'PRINTER_NOT_FOUND'
          }
        });
      }

      // Set maintenance mode
      printer.status = 'maintenance';
      printer.maintenance.lastMaintenance = new Date();
      if (notes) printer.maintenance.maintenanceNotes = notes;
      if (estimatedDuration) {
        const nextMaintenance = new Date();
        nextMaintenance.setMinutes(nextMaintenance.getMinutes() + estimatedDuration);
        printer.maintenance.nextMaintenance = nextMaintenance;
      }
      printer.lastChecked = new Date();

      await printer.save();

      res.json({
        success: true,
        data: printer,
        message: 'Printer set to maintenance mode'
      });
    } catch (error) {
      console.error('❌ Maintenance mode error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to set maintenance mode',
          code: 'MAINTENANCE_ERROR'
        }
      });
    }
  }
);

// GET /api/printers/:id/queue - Get printer queue
router.get('/:id/queue',
  [
    param('id').isMongoId().withMessage('Valid printer ID is required'),
    requireAuth
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      const printer = await Printer.findById(id)
        .populate({
          path: 'queue',
          select: 'clerkUserId file.originalName settings status createdAt estimatedCompletionTime',
          options: { sort: { createdAt: 1 } }
        });

      if (!printer) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Printer not found',
            code: 'PRINTER_NOT_FOUND'
          }
        });
      }

      res.json({
        success: true,
        data: {
          printer: {
            _id: printer._id,
            name: printer.name,
            location: printer.location,
            status: printer.status
          },
          queue: printer.queue,
          queueLength: printer.queueLength
        }
      });
    } catch (error) {
      console.error('❌ Get printer queue error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch printer queue',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

module.exports = router;
