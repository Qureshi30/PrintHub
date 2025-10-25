const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const User = require('../models/User');
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

// GET /api/users/health - Simple health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User routes are working',
    timestamp: new Date().toISOString()
  });
});

// GET /api/users/:userId/stats - Get user statistics
router.get('/:userId/stats',
  requireAuth,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Get user's print job statistics
      const printJobs = await PrintJob.find({ 'user.clerkUserId': userId });

      const stats = {
        totalPrintJobs: printJobs.length,
        completedJobs: printJobs.filter(job => job.status === 'completed').length,
        pendingJobs: printJobs.filter(job => ['pending', 'processing', 'printing'].includes(job.status)).length,
        failedJobs: printJobs.filter(job => job.status === 'failed').length,
        totalPagesPrinted: printJobs.reduce((total, job) => total + (job.totalPages || 0), 0),
        totalCost: printJobs.reduce((total, job) => total + (job.cost || 0), 0),
        lastPrintJob: printJobs.length > 0 ? printJobs[printJobs.length - 1].createdAt : null
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ User stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch user statistics',
          code: 'STATS_ERROR'
        }
      });
    }
  }
);

// GET /api/users - Get all users (simplified)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).select('-__v').limit(10);
    res.json({
      success: true,
      data: {
        users,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  }
});

// GET /api/users/profile - Get current user's profile
router.get('/profile',
  requireAuth,
  async (req, res) => {
    try {
      const clerkUserId = req.auth.userId;

      console.log('📖 Fetching profile for user:', clerkUserId);

      // Find user in MongoDB
      const user = await User.findOne({ clerkUserId });

      if (!user) {
        console.log('⚠️ User profile not found in MongoDB');
        return res.status(404).json({
          success: false,
          error: {
            message: 'User profile not found',
            code: 'PROFILE_NOT_FOUND'
          }
        });
      }

      res.json({
        success: true,
        data: {
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone,
            email: user.profile.email
          }
        }
      });
    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch profile',
          code: 'FETCH_ERROR'
        }
      });
    }
  }
);

// PUT /api/users/profile - Update current user's profile (firstName, lastName, phone only)
router.put('/profile',
  requireAuth,
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^[\d\s\-\+\(\)]+$/)
      .withMessage('Phone number must contain only digits, spaces, and valid characters')
      .isLength({ min: 10, max: 20 })
      .withMessage('Phone number must be between 10 and 20 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const clerkUserId = req.auth.userId;
      const { firstName, lastName, phone } = req.body;

      console.log('📝 Update profile request:', { clerkUserId, firstName, lastName, phone });

      // Only allow updating these specific fields
      const updateData = {};
      if (firstName !== undefined) updateData['profile.firstName'] = firstName;
      if (lastName !== undefined) updateData['profile.lastName'] = lastName;
      if (phone !== undefined) updateData['profile.phone'] = phone;

      // Check if at least one field is being updated
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No valid fields to update',
            code: 'NO_UPDATE_FIELDS'
          }
        });
      }

      // Find user first
      let user = await User.findOne({ clerkUserId });

      // If user doesn't exist in MongoDB, create them
      if (!user) {
        console.log('⚠️ User not found in MongoDB, creating new user record');

        // Get user data from Clerk (already available in req.user from middleware)
        user = new User({
          clerkUserId,
          role: req.user?.role || 'student',
          profile: {
            firstName,
            lastName,
            email: req.user?.email,
            phone
          }
        });
        await user.save();
        console.log('✅ User created in MongoDB');
      } else {
        // Update existing user
        user = await User.findOneAndUpdate(
          { clerkUserId },
          { $set: updateData },
          { new: true, runValidators: true }
        );
        console.log('✅ User updated in MongoDB');
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone,
            email: user.profile.email
          }
        }
      });
    } catch (error) {
      console.error('❌ Profile update error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update profile',
          code: 'UPDATE_ERROR'
        }
      });
    }
  }
);

module.exports = router;
