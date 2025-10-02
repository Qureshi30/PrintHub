const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const PrintJob = require('../models/PrintJob');
const Printer = require('../models/Printer');
const Revenue = require('../models/Revenue');
const router = express.Router();

/**
 * @route   GET /students/dashboard-stats
 * @desc    Get student dashboard statistics with real data
 * @access  Authenticated users
 */
router.get('/dashboard-stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 Student dashboard stats requested by: ${req.user.fullName} (${req.user.email})`);
// Get real stats from database
const [pendingJobs, completedJobs, totalSpentResult, availablePrintersCount] = await Promise.all([
  // Count pending jobs for this user
  PrintJob.countDocuments({ 
    clerkUserId: userId, 
    status: { $in: ['pending', 'queued', 'printing', 'payment_verified'] } 
  }),

  // Count completed jobs for this user
  PrintJob.countDocuments({ 
    clerkUserId: userId, 
    status: 'completed' 
  }),

  // Calculate total money spent by this user from Revenue collection
  Revenue.aggregate([
    { 
      $match: { 
        clerkUserId: userId
      } 
    },
    { 
      $group: { 
        _id: null, 
        totalSpent: { $sum: '$price' } 
      } 
    }
  ]),

  // Count available (online & active) printers
  Printer.countDocuments({ 
    status: 'online', 
    isActive: true 
  })
]);

// Extract total spent value safely from Revenue collection
const totalSpent = totalSpentResult[0]?.totalSpent || 0;
    const stats = {
      pendingJobs,
      completedJobs,
      totalSpent: Math.round(totalSpent * 100) / 100, // Round to 2 decimal places
      availablePrinters: availablePrintersCount
    };

    console.log(`✅ Dashboard stats for ${req.user.fullName}:`, stats);

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
