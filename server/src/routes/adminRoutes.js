const express = require('express');
const { requireAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @route   GET /admin/overview
 * @desc    Get admin overview data - requires admin role
 * @access  Admin only
 */
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    console.log(`📊 Admin overview accessed by: ${req.user.fullName} (${req.user.email})`);
    
    res.json({
      success: true,
      message: 'Welcome Admin',
      data: {
        user: {
          id: req.user.id,
          name: req.user.fullName,
          email: req.user.email,
          role: req.user.role
        },
        timestamp: new Date().toISOString(),
        systemStatus: 'operational'
      }
    });
  } catch (error) {
    console.error('❌ Admin overview error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load admin overview',
        code: 'ADMIN_OVERVIEW_ERROR'
      }
    });
  }
});

/**
 * @route   GET /admin/dashboard-stats
 * @desc    Get admin dashboard statistics
 * @access  Admin only
 */
router.get('/dashboard-stats', requireAdmin, async (req, res) => {
  try {
    // In a real app, you'd fetch actual stats from your database
    const stats = {
      totalUsers: 142,
      activePrintJobs: 23,
      totalPrinters: 8,
      onlinePrinters: 6,
      todaysPrintJobs: 34,
      weeklyRevenue: 1250.75,
      systemUptime: '99.8%',
      avgProcessingTime: '2.3 minutes',
      // Additional stats for AdminDashboard component
      activeStudents: 128,
      printJobsToday: 34,
      revenueToday: 245.75,
      activePrinters: 6,
      maintenancePrinters: 2,
      totalRevenue: 12450.75
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load dashboard statistics',
        code: 'ADMIN_STATS_ERROR'
      }
    });
  }
});

/**
 * @route   GET /admin/analytics
 * @desc    Get detailed analytics data for admin dashboard
 * @access  Admin only
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    console.log(`📊 Analytics accessed by: ${req.user.fullName} (${req.user.email})`);
    
    // In a real app, you'd fetch actual analytics from your database
    const analytics = {
      totalPrintJobs: 1247,
      totalRevenue: 3456.78,
      totalUsers: 542,
      activePrinters: 8,
      lastMonthGrowth: {
        jobs: 15.2,
        revenue: 12.8,
        users: 8.5
      },
      popularPaperTypes: [
        { type: 'A4', count: 856, percentage: 68.7 },
        { type: 'A3', count: 234, percentage: 18.8 },
        { type: 'Letter', count: 157, percentage: 12.5 }
      ],
      dailyStats: [
        { date: '2025-08-23', jobs: 45, revenue: 123.50 },
        { date: '2025-08-24', jobs: 52, revenue: 145.20 },
        { date: '2025-08-25', jobs: 38, revenue: 98.75 },
        { date: '2025-08-26', jobs: 61, revenue: 178.90 },
        { date: '2025-08-27', jobs: 49, revenue: 134.60 },
        { date: '2025-08-28', jobs: 55, revenue: 156.80 },
        { date: '2025-08-29', jobs: 47, revenue: 128.45 }
      ],
      monthlyStats: [
        { month: 'Jan', jobs: 1123, revenue: 3245.67 },
        { month: 'Feb', jobs: 1045, revenue: 2987.43 },
        { month: 'Mar', jobs: 1189, revenue: 3456.12 },
        { month: 'Apr', jobs: 1267, revenue: 3678.90 },
        { month: 'May', jobs: 1345, revenue: 3890.45 },
        { month: 'Jun', jobs: 1423, revenue: 4123.78 },
        { month: 'Jul', jobs: 1389, revenue: 4045.32 },
        { month: 'Aug', jobs: 1247, revenue: 3456.78 }
      ],
      printerUsage: [
        { printer: 'HP LaserJet Pro 1', usage: 87, status: 'online' },
        { printer: 'Canon PIXMA 2', usage: 65, status: 'online' },
        { printer: 'Epson EcoTank 3', usage: 92, status: 'maintenance' },
        { printer: 'Brother HL-L2350DW', usage: 78, status: 'online' }
      ]
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load analytics',
        code: 'ANALYTICS_ERROR'
      }
    });
  }
});

/**
 * @route   POST /admin/test-auth
 * @desc    Test admin authentication endpoint
 * @access  Admin only
 */
router.post('/test-auth', requireAdmin, async (req, res) => {
  res.json({
    success: true,
    message: 'Admin authentication successful',
    user: {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
      name: req.user.fullName
    }
  });
});

module.exports = router;
