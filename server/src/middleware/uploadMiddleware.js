const multer = require('multer');
const path = require('path');
const { validateFile } = require('../config/cloudinary');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory for Cloudinary upload

const fileFilter = (req, file, cb) => {
  try {
    console.log('🔍 File filter checking:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size || 'unknown'
    });
    
    // Use our Cloudinary validation
    validateFile(file);
    console.log('✅ File validation passed:', file.originalname);
    cb(null, true);
  } catch (error) {
    console.error('❌ File validation failed:', error.message);
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
    files: 5, // Maximum 5 files per request
  },
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: {
                message: `File size exceeds limit of ${Math.round((parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1024 / 1024)}MB`,
                code: 'FILE_TOO_LARGE'
              }
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              error: {
                message: 'Unexpected file field',
                code: 'UNEXPECTED_FILE'
              }
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          error: {
            message: err.message || 'File upload error',
            code: 'UPLOAD_ERROR'
          }
        });
      }
      
      next();
    });
  };
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: {
                message: `File size exceeds limit of ${Math.round((parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1024 / 1024)}MB`,
                code: 'FILE_TOO_LARGE'
              }
            });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              error: {
                message: `Too many files. Maximum ${maxCount} files allowed`,
                code: 'TOO_MANY_FILES'
              }
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          error: {
            message: err.message || 'File upload error',
            code: 'UPLOAD_ERROR'
          }
        });
      }
      
      next();
    });
  };
};

// Middleware to validate file presence
const requireFile = (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No file provided',
        code: 'FILE_REQUIRED'
      }
    });
  }
  next();
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  requireFile,
};
