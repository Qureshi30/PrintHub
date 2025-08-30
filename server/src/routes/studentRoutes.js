const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const PrintJob = require('../models/PrintJob');
const router = express.Router();

/**
 * @route   GET /students/dashboard-stats
 * @desc    Get student dashboard statistics
 * @access  Authenticated users
 */
router.get('/dashboard-stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 Student dashboard stats requested by: ${req.user.fullName} (${req.user.email})`);
    
    // In a real app, you'd fetch actual stats from your database based on userId
    const stats = {
      pendingJobs: 2,
      completedJobs: 15,
      totalSpent: 47.25,
      availablePrinters: 6
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Student dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load dashboard statistics',
        code: 'STUDENT_STATS_ERROR'
      }
    });
  }
});

/**
 * @route   GET /students/profile
 * @desc    Get student profile information
 * @access  Authenticated users
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Student profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load profile',
        code: 'STUDENT_PROFILE_ERROR'
      }
    });
  }
});

/**
 * @route   GET /students/print-jobs
 * @desc    Get student's print jobs
 * @access  Authenticated students
 */
router.get('/print-jobs', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🖨️ Fetching print jobs for student: ${userId}`);
    
    const printJobs = await PrintJob.find({ clerkUserId: userId })
      .populate('printerId', 'name location')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${printJobs.length} print jobs for student: ${userId}`);
    
    res.json({
      success: true,
      data: printJobs
    });
  } catch (error) {
    console.error('❌ Student print jobs error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch print jobs',
        code: 'STUDENT_PRINT_JOBS_ERROR'
      }
    });
  }
});

module.exports = router;
