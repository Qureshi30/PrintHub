const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadSingle, uploadMultiple, requireFile } = require('../middleware/uploadMiddleware');
const { uploadToCloudinary, generateSignedUploadUrl, deleteFromCloudinary } = require('../config/cloudinary');
const PrintJob = require('../models/PrintJob');
const Printer = require('../models/Printer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailNotificationService = require('../services/emailNotificationService');

const router = express.Router();

// POST /api/upload/cloudinary-signature - Get signed upload parameters for Cloudinary
router.post('/cloudinary-signature',
  [requireAuth],
  async (req, res) => {
    try {
      const { generateSignedUploadUrl } = require('../config/cloudinary');
      
      console.log('🔐 Generating signature for user:', req.auth.userId);
      
      // Generate signed upload parameters
      const signedParams = generateSignedUploadUrl({
        folder: `print_jobs/${req.auth.userId}`,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      });

      console.log('✅ Generated signature params:', {
        ...signedParams,
        signature: signedParams.signature.substring(0, 10) + '...' // Only log partial signature for security
      });

      res.json({
        success: true,
        data: signedParams,
        message: 'Signed upload parameters generated'
      });
    } catch (error) {
      console.error('❌ Signature generation error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to generate upload signature',
          code: 'SIGNATURE_ERROR'
        }
      });
    }
  }
);

// GET /api/upload/test-cloudinary - Test Cloudinary configuration
router.get('/test-cloudinary', (req, res) => {
  try {
    const { validateCloudinaryConfig } = require('../config/cloudinary');
    validateCloudinaryConfig();
    
    res.json({
      success: true,
      message: 'Cloudinary configuration is valid',
      config: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: 'CLOUDINARY_CONFIG_ERROR'
      }
    });
  }
});

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  console.log('🔍 Validation check:', {
    hasErrors: !errors.isEmpty(),
    errorCount: errors.array().length,
    errors: errors.array()
  });
  
  if (!errors.isEmpty()) {
    console.log('❌ Validation failed:', errors.array());
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  
  console.log('✅ Validation passed');
  next();
};

// POST /api/upload/file - Upload file to Cloudinary
router.post('/file',
  [
    (req, res, next) => {
      console.log('📥 Upload request received:');
      console.log('Headers:', {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
      });
      console.log('Body keys:', Object.keys(req.body || {}));
      next();
    },
    requireAuth,
    (req, res, next) => {
      console.log('🔐 Auth passed, user:', req.auth?.userId);
      next();
    },
    uploadSingle('file'),
    (req, res, next) => {
      console.log('📎 After multer middleware:', {
        hasFile: !!req.file,
        fileDetails: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : 'No file'
      });
      next();
    },
    requireFile,
    (req, res, next) => {
      console.log('📋 After file requirement check');
      next();
    },
    body('folder').optional().trim().isLength({ max: 100 }).withMessage('Folder name too long')
  ],
  validateRequest,
  async (req, res) => {
    try {
      console.log('📁 File upload request received:', {
        hasFile: !!req.file,
        folder: req.body.folder,
        userId: req.auth?.userId
      });

      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({
          success: false,
          error: {
            message: 'No file provided',
            code: 'NO_FILE'
          }
        });
      }

      console.log('🔍 File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? 'present' : 'missing'
      });

      const { folder } = req.body;
      const file = req.file;

      // Create folder path with user ID
      const uploadFolder = folder ? `print_jobs/${req.auth.userId}/${folder}` : `print_jobs/${req.auth.userId}`;

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file, {
        folder: uploadFolder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      });

      res.status(201).json({
        success: true,
        data: {
          publicId: uploadResult.publicId,
          url: uploadResult.url,
          format: uploadResult.format,
          sizeKB: uploadResult.sizeKB,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        },
        message: 'File uploaded successfully'
      });
    } catch (error) {
      console.error('❌ File upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'File upload failed',
          code: 'UPLOAD_ERROR'
        }
      });
    }
  }
);

// POST /api/upload/multiple - Upload multiple files to Cloudinary
router.post('/multiple',
  [
    requireAuth,
    uploadMultiple('files', 5),
    body('folder').optional().trim().isLength({ max: 100 }).withMessage('Folder name too long')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { folder } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No files provided',
            code: 'FILES_REQUIRED'
          }
        });
      }

      // Create folder path with user ID
      const uploadFolder = folder ? `print_jobs/${req.auth.userId}/${folder}` : `print_jobs/${req.auth.userId}`;

      // Upload all files
      const uploadPromises = files.map(file => 
        uploadToCloudinary(file, {
          folder: uploadFolder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        }).then(result => ({
          ...result,
          originalName: file.originalname
        }))
      );

      const uploadResults = await Promise.all(uploadPromises);

      res.status(201).json({
        success: true,
        data: {
          files: uploadResults,
          count: uploadResults.length,
          uploadedAt: new Date().toISOString()
        },
        message: `${uploadResults.length} files uploaded successfully`
      });
    } catch (error) {
      console.error('❌ Multiple file upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'File upload failed',
          code: 'UPLOAD_ERROR'
        }
      });
    }
  }
);

// GET /api/upload/signature - Get signed upload parameters for client-side upload
router.get('/signature',
  [
    requireAuth,
    body('folder').optional().trim().isLength({ max: 100 }).withMessage('Folder name too long'),
    body('public_id').optional().trim().isLength({ max: 100 }).withMessage('Public ID too long')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { folder, public_id } = req.query;

      // Create folder path with user ID
      const uploadFolder = folder ? `print_jobs/${req.auth.userId}/${folder}` : `print_jobs/${req.auth.userId}`;

      const options = {
        folder: uploadFolder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      };

      if (public_id) {
        options.public_id = public_id;
      }

      const signatureData = generateSignedUploadUrl(options);

      res.json({
        success: true,
        data: signatureData,
        message: 'Upload signature generated'
      });
    } catch (error) {
      console.error('❌ Generate signature error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate upload signature',
          code: 'SIGNATURE_ERROR'
        }
      });
    }
  }
);

// DELETE /api/upload/:publicId - Delete file from Cloudinary
router.delete('/:publicId',
  [
    requireAuth
  ],
  async (req, res) => {
    try {
      const { publicId } = req.params;

      // Verify the file belongs to the user (check if publicId starts with user's folder)
      const userFolder = `print_jobs/${req.auth.userId}`;
      if (!publicId.startsWith(userFolder) && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied to this file',
            code: 'FORBIDDEN'
          }
        });
      }

      const result = await deleteFromCloudinary(publicId);

      if (result.result === 'ok') {
        res.json({
          success: true,
          message: 'File deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            message: 'File not found or already deleted',
            code: 'FILE_NOT_FOUND'
          }
        });
      }
    } catch (error) {
      console.error('❌ File deletion error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete file',
          code: 'DELETE_ERROR'
        }
      });
    }
  }
);

// GET /api/upload/validate - Validate file before upload
router.post('/validate',
  [
    requireAuth,
    uploadSingle('file'),
    requireFile
  ],
  async (req, res) => {
    try {
      const file = req.file;

      // File validation is already done by multer middleware
      // If we reach here, file is valid

      res.json({
        success: true,
        data: {
          filename: file.originalname,
          size: file.size,
          sizeKB: Math.round(file.size / 1024),
          mimetype: file.mimetype,
          isValid: true
        },
        message: 'File is valid for upload'
      });
    } catch (error) {
      console.error('❌ File validation error:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'File validation failed',
          code: 'VALIDATION_ERROR'
        }
      });
    }
  }
);

// GET /api/upload/limits - Get upload limits and allowed file types
router.get('/limits',
  async (req, res) => {
    try {
      const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB default
      const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'
      ];

      res.json({
        success: true,
        data: {
          maxFileSize,
          maxFileSizeMB: Math.round(maxFileSize / 1024 / 1024),
          allowedFileTypes: allowedTypes,
          maxFilesPerUpload: 5
        }
      });
    } catch (error) {
      console.error('❌ Get upload limits error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch upload limits',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// POST /api/upload/print-job - Upload file and create print job
router.post('/print-job',
  [
    requireAuth,
    // Conditional multer middleware - only if uploading a new file
    (req, res, next) => {
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        uploadSingle('file')(req, res, (err) => {
          if (err) return next(err);
          requireFile(req, res, next);
        });
      } else {
        next();
      }
    },
    body('printerId').isMongoId().withMessage('Valid printer ID is required'),
    body('settings.copies').optional().isInt({ min: 1, max: 100 }).withMessage('Copies must be between 1 and 100'),
    body('settings.color').optional().isBoolean(),
    body('settings.duplex').optional().isBoolean(),
    body('settings.paperType').optional().isIn(['A4', 'A3', 'Letter', 'Legal', 'Certificate']),
    body('settings.pages').optional().trim(),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
    // Validation for existing Cloudinary file
    body('cloudinaryUrl').optional().isURL().withMessage('Valid Cloudinary URL required'),
    body('cloudinaryPublicId').optional().trim().notEmpty().withMessage('Cloudinary public ID required'),
    body('originalName').optional().trim().notEmpty().withMessage('Original filename required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { printerId, settings = {}, notes, cloudinaryUrl, cloudinaryPublicId, originalName } = req.body;
      const file = req.file;
      const clerkUserId = req.auth.userId;
      let fileData;

      console.log('📄 Print job request:', {
        hasFile: !!file,
        hasCloudinaryData: !!(cloudinaryUrl && cloudinaryPublicId),
        printerId,
        settings,
        originalName
      });

      // Determine file data source
      if (cloudinaryUrl && cloudinaryPublicId && originalName) {
        // Using existing Cloudinary file
        fileData = {
          cloudinaryUrl,
          publicId: cloudinaryPublicId,
          originalName,
          format: originalName.split('.').pop()?.toLowerCase() || 'unknown',
          sizeKB: 0, // Size not available for existing files
        };
        console.log('📁 Using existing Cloudinary file:', originalName);
      } else if (file) {
        // Upload new file to Cloudinary
        console.log('📤 Uploading new file to Cloudinary:', file.originalname);
        const uploadFolder = `print_jobs/${clerkUserId}`;
        const uploadResult = await uploadToCloudinary(file, {
          folder: uploadFolder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        });

        fileData = {
          cloudinaryUrl: uploadResult.url,
          publicId: uploadResult.publicId,
          originalName: file.originalname,
          format: uploadResult.format,
          sizeKB: uploadResult.sizeKB,
        };
      } else {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Either file upload or existing Cloudinary file data is required',
            code: 'FILE_REQUIRED'
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

      if (printer.status !== 'online') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Printer is not available',
            code: 'PRINTER_UNAVAILABLE'
          }
        });
      }

      // Calculate pricing
      const baseCostPerPage = 0.10; // $0.10 per page
      const colorSurcharge = settings.color ? 0.05 : 0; // $0.05 extra for color
      
      let paperTypeSurcharge = 0;
      if (settings.paperType === 'A3') {
        paperTypeSurcharge = 0.05;
      } else if (settings.paperType === 'Certificate') {
        paperTypeSurcharge = 0.10;
      }
      
      // Estimate pages (rough calculation - in real scenario you'd use a PDF parser)
      const estimatedPages = fileData.sizeKB > 0 ? Math.max(1, Math.ceil(fileData.sizeKB / 100)) : 1;
      
      let actualPages = estimatedPages;
      if (settings.pages) {
        if (settings.pages === 'all') {
          actualPages = estimatedPages;
        } else {
          actualPages = settings.pages.split(',').length;
        }
      }
      
      const copies = settings.copies || 1;
      const totalPages = actualPages * copies;
      const totalCost = (baseCostPerPage + colorSurcharge + paperTypeSurcharge) * totalPages;

      // Get user info for additional fields
      const user = await User.findOne({ clerkUserId });

      // Create print job
      const printJob = new PrintJob({
        // User Details
        clerkUserId,
        userName: user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim() : undefined,
        userEmail: user?.profile?.email,
        
        // Printer Details
        printerId,
        
        // File Details
        file: {
          cloudinaryUrl: fileData.cloudinaryUrl,
          publicId: fileData.publicId,
          originalName: fileData.originalName,
          format: fileData.format,
          sizeKB: fileData.sizeKB,
        },
        
        // Print Settings
        settings: {
          pages: settings.pages || 'all',
          copies: copies,
          color: settings.color || false,
          duplex: settings.duplex || false,
          paperType: settings.paperType || 'A4',
        },
        
        // Queue & Status
        status: 'queued',
        queuePosition: printer.queue.length + 1,
        estimatedCompletionTime: new Date(Date.now() + (printer.queue.length * 3 + 5) * 60000), // Rough estimate
        
        // Cost Details
        cost: {
          baseCost: baseCostPerPage * totalPages,
          colorCost: settings.color ? colorSurcharge * totalPages : 0,
          paperCost: paperTypeSurcharge * totalPages,
          totalCost,
        },
        
        // Payment Status
        payment: {
          status: 'unpaid',
          method: 'student_credit',
        },
        
        // Job History
        timing: {
          submittedAt: new Date(),
        },
        misprint: false,
        reprintCount: 0,
        
        // Additional fields
        notes,
      });

      const savedJob = await printJob.save();

      // Add job to printer queue
      printer.queue.push(savedJob._id);
      await printer.save();

      // Update user statistics
      if (user) {
        user.statistics.totalJobs += 1;
        await user.save();
      }

      // Create notification for admin
      const adminNotification = new Notification({
        clerkUserId: 'admin', // This should be the actual admin's clerkUserId
        jobId: savedJob._id,
        type: 'new_print_job',
        title: 'New Print Job Submitted',
        message: `New print job submitted: ${originalName || file?.originalname || 'Unknown file'}`,
        read: false,
      });
      await adminNotification.save();

      // Create confirmation notification for user
      const userNotification = new Notification({
        clerkUserId,
        jobId: savedJob._id,
        type: 'job_submitted',
        title: 'Print Job Submitted Successfully',
        message: `Your print job "${originalName || file?.originalname || 'Unknown file'}" has been submitted successfully`,
        read: false,
      });
      await userNotification.save();

      // Send email notification to admin
      try {
        const userEmail = user?.profile?.email || 'unknown@example.com';
        await emailNotificationService.sendNewPrintJobNotification(savedJob, userEmail);
      } catch (emailError) {
        console.error('⚠️ Email notification failed:', emailError);
        // Don't fail the entire request if email fails
      }

      res.status(201).json({
        success: true,
        data: {
          printJob: savedJob,
          upload: {
            publicId: uploadResult.publicId,
            url: uploadResult.url,
            format: uploadResult.format,
            sizeKB: uploadResult.sizeKB,
          },
          queuePosition: savedJob.queuePosition,
          estimatedCompletionTime: savedJob.estimatedCompletionTime,
        },
        message: 'Print job created successfully'
      });

    } catch (error) {
      console.error('❌ Print job creation error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Print job creation failed',
          code: 'PRINT_JOB_ERROR'
        }
      });
    }
  }
);

module.exports = router;
