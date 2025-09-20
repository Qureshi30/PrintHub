const express = require('express');
const { requireAdmin } = require('../middleware/authMiddleware');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
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
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['admin', 'staff', 'student']).withMessage('Invalid role'),
    requireAdmin
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;

      console.log(`👤 Admin ${req.user?.fullName || 'Unknown'} creating new ${role} user: ${email}`);

      // Create user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        firstName,
        lastName,
        emailAddress: [email],
        password,
        publicMetadata: {
          role: role
        },
        privateMetadata: {
          createdBy: req.user.id,
          createdAt: new Date().toISOString()
        }
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

      // Handle Clerk-specific errors
      if (error.errors && error.errors[0]) {
        const clerkError = error.errors[0];
        return res.status(400).json({
          success: false,
          error: {
            message: clerkError.message || 'User creation failed',
            code: clerkError.code || 'CREATE_USER_ERROR'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create user',
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
router.get('/users', requireAdmin, async (req, res) => {
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

console.log('📝 Admin create-user route registered');

module.exports = router;
