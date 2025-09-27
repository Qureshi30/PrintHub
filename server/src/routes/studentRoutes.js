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

    // Get user's print jobs to calculate real statistics
    const printJobs = await PrintJob.find({ clerkUserId: userId });

    // Calculate pending jobs (queued, printing, payment_verified)
    const pendingJobs = printJobs.filter(job =>
      ['queued', 'printing', 'payment_verified', 'pending'].includes(job.status)
    ).length;

    // Calculate completed jobs
    const completedJobs = printJobs.filter(job => job.status === 'completed').length;

    // Calculate total spent from completed and paid jobs
    const totalSpent = printJobs
      .filter(job => job.payment && job.payment.status === 'completed')
      .reduce((sum, job) => sum + (job.payment.amount || 0), 0);

    // Get available printers count (this is system-wide, not user-specific)
    const Printer = require('../models/Printer');
    const availablePrintersCount = await Printer.countDocuments({
      status: 'online',
      isActive: true
    });

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
