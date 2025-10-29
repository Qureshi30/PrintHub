const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const PrintJob = require('../models/PrintJob');
const Printer = require('../models/Printer');
const Revenue = require('../models/Revenue');
const {
  getCurrentPricing,
  updatePricing,
  getPricingHistory,
  resetToDefaults
} = require('../controllers/pricingController');
const {
  terminatePrintJob,
  getTerminatedJobs
} = require('../controllers/terminateJobController');
const router = express.Router();

console.log('🔧 Loading admin routes...');

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

/**
 * @route   POST /admin/create-user
 * @desc    Create a new user with admin privileges
 * @access  Admin only
 */
router.post('/create-user',
  requireAdmin,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['admin', 'staff', 'student']).withMessage('Invalid role')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;

      console.log(`👤 Admin ${req.user?.fullName || 'Unknown'} creating new ${role} user: ${email}`);

      // Create user in Clerk using SDK v5 format
      // Reference: https://clerk.com/docs/references/backend/user/create-user
      const clerkUser = await clerkClient.users.createUser({
        firstName,
        lastName,
        emailAddress: [email],
        password,
        publicMetadata: {
          role
        },
        privateMetadata: {
          createdBy: req.user.id,
          createdAt: new Date().toISOString()
        },
        skipPasswordChecks: true
      });

      // Create user record in our database
      const dbUser = new User({
        clerkUserId: clerkUser.id,
        role: role,
        profile: {
          firstName,
          lastName,
          email,
        },
        preferences: {
          emailNotifications: true,
          defaultPaperType: 'A4',
          defaultColor: false,
        },
        status: 'active'
      });

      await dbUser.save();

      console.log(`✅ User created successfully: ${email} (${role})`);

      res.status(201).json({
        success: true,
        data: {
          clerkUserId: clerkUser.id,
          email: email,
          role: role,
          fullName: `${firstName} ${lastName}`
        },
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully`
      });

    } catch (error) {
      console.error('❌ Create user error:', error);

      // Log detailed Clerk error information
      if (error.clerkError && error.errors) {
        console.error('Clerk Error Details:', JSON.stringify(error.errors, null, 2));
        if (error.errors[0]?.meta) {
          console.error('Error Meta:', JSON.stringify(error.errors[0].meta, null, 2));
        }
      }

      // Handle Clerk-specific errors
      if (error.errors && error.errors[0]) {
        const clerkError = error.errors[0];
        return res.status(400).json({
          success: false,
          error: {
            message: clerkError.longMessage || clerkError.message || 'User creation failed',
            code: clerkError.code || 'CREATE_USER_ERROR',
            details: error.errors
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to create user',
          code: 'CREATE_USER_ERROR'
        }
      });
    }
  }
);

/**
 * @route   GET /admin/users
 * @desc    Get all users for admin management
 * @access  Admin only
 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log(`👥 Admin ${req.user.fullName} fetching all users`);

    // Get all users from database
    const users = await User.find({})
      .select('clerkUserId role profile status createdAt lastActiveAt')
      .sort({ createdAt: -1 })
      .lean();

    // Enhance with Clerk data if needed
    const enhancedUsers = users.map(user => ({
      id: user._id,
      clerkUserId: user.clerkUserId,
      role: user.role,
      email: user.profile?.email || '',
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      fullName: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
      status: user.status,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt
    }));

    console.log(`✅ Retrieved ${enhancedUsers.length} users`);

    res.json({
      success: true,
      data: enhancedUsers,
      total: enhancedUsers.length
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch users',
        code: 'GET_USERS_ERROR'
      }
    });
  }
});

/**
 * @route   DELETE /admin/users/:clerkUserId
 * @desc    Delete a user from both Clerk and MongoDB
 * @access  Admin only
 */
router.delete('/users/:clerkUserId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    console.log(`🗑️ Admin ${req.user.fullName} deleting user: ${clerkUserId}`);

    // First, delete from MongoDB
    const deletedUser = await User.findOneAndDelete({ clerkUserId });

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found in database',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Then delete from Clerk
    try {
      const clerkClient = require('@clerk/clerk-sdk-node').default;
      await clerkClient.users.deleteUser(clerkUserId);
      console.log(`✅ User deleted from Clerk: ${clerkUserId}`);
    } catch (clerkError) {
      console.warn(`⚠️ Failed to delete from Clerk (user may already be deleted): ${clerkError.message}`);
      // Continue even if Clerk deletion fails (user might already be deleted there)
    }

    console.log(`✅ User deleted successfully: ${deletedUser.profile?.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        clerkUserId: deletedUser.clerkUserId,
        email: deletedUser.profile?.email
      }
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete user',
        code: 'DELETE_USER_ERROR'
      }
    });
  }
});

/**
 * @route   GET /admin/test
 * @desc    Test endpoint to verify admin routes are working
 * @access  Public (for testing)
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes are working!',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET/POST /admin/create-sample-users
 * @desc    Create sample users for testing (development only)
 * @access  Public (for testing)
 */
const createSampleUsersHandler = async (req, res) => {
  try {
    const sampleUsers = [
      {
        clerkUserId: 'sample_admin_001',
        role: 'admin',
        profile: {
          firstName: 'John',
          lastName: 'Admin',
          email: 'john.admin@example.com'
        },
        status: 'active'
      },
      {
        clerkUserId: 'sample_staff_001',
        role: 'staff',
        profile: {
          firstName: 'Jane',
          lastName: 'Staff',
          email: 'jane.staff@example.com'
        },
        status: 'active'
      },
      {
        clerkUserId: 'sample_student_001',
        role: 'student',
        profile: {
          firstName: 'Bob',
          lastName: 'Student',
          email: 'bob.student@example.com'
        },
        status: 'active'
      }
    ];

    // Clear existing sample users
    await User.deleteMany({ clerkUserId: { $regex: '^sample_' } });

    // Insert sample users
    const createdUsers = await User.insertMany(sampleUsers);

    res.json({
      success: true,
      message: `Created ${createdUsers.length} sample users`,
      data: createdUsers
    });

  } catch (error) {
    console.error('Error creating sample users:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

router.get('/create-sample-users', createSampleUsersHandler);
router.post('/create-sample-users', createSampleUsersHandler);

/**
 * @route   GET /admin/overview
 * @desc    Get admin overview data - requires admin role
 * @access  Admin only
 */
router.get('/overview', requireAuth, requireAdmin, async (req, res) => {
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
router.get('/dashboard-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Fetch actual stats from database

    // Count active students (users with role 'student' and status 'active')
    const activeStudents = await User.countDocuments({
      role: 'student',
      status: 'active'
    });

    // Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Count print jobs submitted today
    const printJobsToday = await PrintJob.countDocuments({
      'timing.submittedAt': { $gte: startOfDay, $lte: endOfDay }
    });

    // Calculate revenue today
    const revenueTodayResult = await Revenue.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$price' }
        }
      }
    ]);
    const revenueToday = revenueTodayResult.length > 0 ? revenueTodayResult[0].total : 0;

    // Count active printers
    const activePrinters = await Printer.countDocuments({ status: 'online' });

    // Count maintenance printers
    const maintenancePrinters = await Printer.countDocuments({ status: 'maintenance' });

    // Count total printers
    const totalPrinters = await Printer.countDocuments();

    // Calculate total revenue
    const totalRevenueResult = await Revenue.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // Count total users
    const totalUsers = await User.countDocuments();

    const stats = {
      totalUsers,
      activePrintJobs: await PrintJob.countDocuments({ status: { $in: ['queued', 'printing'] } }),
      totalPrinters,
      onlinePrinters: activePrinters,
      todaysPrintJobs: printJobsToday,
      weeklyRevenue: 1250.75, // TODO: Calculate actual weekly revenue
      systemUptime: '99.8%', // TODO: Calculate actual uptime
      avgProcessingTime: '2.3 minutes', // TODO: Calculate actual avg processing time
      // Additional stats for AdminDashboard component
      activeStudents,
      printJobsToday,
      revenueToday,
      activePrinters,
      maintenancePrinters,
      totalRevenue
    };

    console.log('📊 Dashboard stats:', stats);

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
 * @desc    Get detailed analytics data for admin dashboard (Dynamic)
 * @access  Admin only
 */
router.get('/analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log(`📊 Analytics accessed by: ${req.user.fullName} (${req.user.email})`);

    // 1. Total Print Jobs - Count completed jobs
    const totalPrintJobs = await PrintJob.countDocuments({ status: 'completed' });
    console.log(`📄 Total completed print jobs: ${totalPrintJobs}`);

    // 2. Total Revenue - Sum all prices from Revenue collection
    const revenueResult = await Revenue.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    console.log(`💰 Total revenue: $${totalRevenue.toFixed(2)}`);

    // 3. Total Users - Count all users
    const totalUsers = await User.countDocuments();
    console.log(`👥 Total users: ${totalUsers}`);

    // 4. Active Printers - Count online printers
    const activePrinters = await Printer.countDocuments({ status: 'online' });
    console.log(`🖨️ Active printers: ${activePrinters}`);

    // Additional analytics data for dashboard

    // Popular Paper Types
    const paperTypesAgg = await PrintJob.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$settings.paperType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const totalCompleted = totalPrintJobs || 1; // Avoid division by zero
    const popularPaperTypes = paperTypesAgg.map(item => ({
      type: item._id || 'Unknown',
      count: item.count,
      percentage: ((item.count / totalCompleted) * 100).toFixed(1)
    }));

    // Printer Usage Statistics
    const printerUsageAgg = await PrintJob.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$printerId',
          jobCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'printers',
          localField: '_id',
          foreignField: '_id',
          as: 'printerInfo'
        }
      },
      { $unwind: { path: '$printerInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          printer: '$printerInfo.name',
          status: '$printerInfo.status',
          jobCount: 1
        }
      }
    ]);

    // Calculate usage percentage (relative to total print jobs)
    // This shows what percentage of all print jobs were sent to each printer
    const totalJobsForPercentage = totalPrintJobs || 1; // Avoid division by zero
    const printerUsage = printerUsageAgg.map(item => ({
      printer: item.printer || 'Unknown Printer',
      usage: Number.parseFloat(((item.jobCount / totalJobsForPercentage) * 100).toFixed(1)),
      jobCount: item.jobCount,
      status: item.status || 'offline'
    }));

    // Daily Stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyJobsAgg = await PrintJob.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          jobs: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyRevenueAgg = await Revenue.aggregate([
      {
        $match: {
          paidAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Merge daily stats
    const dailyRevenueMap = new Map(dailyRevenueAgg.map(item => [item._id, item.revenue]));
    const dailyStats = dailyJobsAgg.map(item => ({
      date: item._id,
      jobs: item.jobs,
      revenue: dailyRevenueMap.get(item._id) || 0
    }));

    const analytics = {
      totalPrintJobs,
      totalRevenue: Number.parseFloat(totalRevenue.toFixed(2)),
      totalUsers,
      activePrinters,
      popularPaperTypes,
      printerUsage,
      dailyStats
    };

    console.log('✅ Analytics data generated successfully');

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
        code: 'ANALYTICS_ERROR',
        details: error.message
      }
    });
  }
});

/**
 * @route   POST /admin/test-auth
 * @desc    Test admin authentication endpoint
 * @access  Admin only
 */
router.post('/test-auth', requireAuth, requireAdmin, async (req, res) => {
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

// ============================================================================
// PRINT JOB TERMINATION ROUTES
// ============================================================================

/**
 * @route   DELETE /admin/printjobs/:id/terminate
 * @desc    Terminate an ongoing or pending print job with refund
 * @access  Admin only
 */
router.delete('/printjobs/:id/terminate',
  requireAuth,
  requireAdmin,
  [
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason must be a string with maximum 500 characters')
  ],
  validateRequest,
  terminatePrintJob
);

/**
 * @route   GET /admin/printjobs/terminated
 * @desc    Get all terminated print jobs
 * @access  Admin only
 */
router.get('/printjobs/terminated', requireAuth, requireAdmin, getTerminatedJobs);

// ============================================================================
// PRICING MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /admin/pricing
 * @desc    Get current pricing configuration (Admin only)
 * @access  Admin only
 */
router.get('/pricing', requireAdmin, getCurrentPricing);

/**
 * @route   PUT /admin/pricing
 * @desc    Update pricing configuration (Admin only)
 * @access  Admin only
 */
router.put('/pricing',
  requireAdmin,
  [
    // Validate base rates
    body('baseRates.blackAndWhite')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Black and white rate must be between 0 and 100'),
    body('baseRates.color')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Color rate must be between 0 and 100'),
    
    // Validate paper surcharges
    body('paperSurcharges.a4')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('A4 surcharge cannot be negative'),
    body('paperSurcharges.a3')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('A3 surcharge cannot be negative'),
    body('paperSurcharges.letter')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Letter surcharge cannot be negative'),
    body('paperSurcharges.legal')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Legal surcharge cannot be negative'),
    body('paperSurcharges.certificate')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Certificate surcharge cannot be negative'),
    
    // Validate discounts
    body('discounts.duplexPercentage')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Duplex discount percentage must be between 0 and 100'),
    
    // Validate description
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ],
  validateRequest,
  updatePricing
);

/**
 * @route   GET /admin/pricing/history
 * @desc    Get pricing configuration history (Admin only)
 * @access  Admin only
 */
router.get('/pricing/history', requireAdmin, getPricingHistory);

/**
 * @route   POST /admin/pricing/reset
 * @desc    Reset pricing to default values (Admin only)
 * @access  Admin only
 */
router.post('/pricing/reset', requireAdmin, resetToDefaults);

console.log('💰 Admin pricing routes registered');
console.log('📝 Admin create-user route registered');

module.exports = router;
