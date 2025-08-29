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

module.exports = router;
