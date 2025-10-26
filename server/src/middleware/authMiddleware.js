const { ClerkExpressRequireAuth, clerkClient } = require('@clerk/clerk-sdk-node');
const jwt = require('jsonwebtoken');

// Enhanced auth middleware that uses Clerk SDK for verification
const requireAuth = async (req, res, next) => {
  try {
    // Use Clerk's built-in middleware for token verification
    ClerkExpressRequireAuth()(req, res, async (error) => {
      if (error) {
        console.log('❌ Clerk auth failed:', error.message);
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          }
        });
      }

      // At this point, req.auth contains the verified Clerk auth data
      const { userId } = req.auth;
      console.log('🔐 Auth middleware - user ID:', userId);

      try {
        // Fetch user details from Clerk to get publicMetadata
        const user = await clerkClient.users.getUser(userId);
        req.user = {
          id: userId,
          role: user.publicMetadata?.role || 'student',
          email: user.emailAddresses?.[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          metadata: user.publicMetadata
        };

        console.log('👤 User loaded:', {
          id: req.user.id,
          role: req.user.role,
          email: req.user.email
        });

        next();
      } catch (userError) {
        console.error('❌ Failed to fetch user from Clerk:', userError);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to load user data',
            code: 'USER_LOAD_FAILED'
          }
        });
      }
    });
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_FAILED'
      }
    });
  }
};

// Admin-only middleware that verifies admin role
const requireAdmin = async (req, res, next) => {
  try {
    // First ensure user is authenticated
    await requireAuth(req, res, () => {
      // Check if user has admin role
      if (req.user?.role !== 'admin') {
        console.log(`❌ Access denied: User ${req.user?.id} has role "${req.user?.role}" but "admin" required`);
        return res.status(403).json({
          success: false,
          error: {
            message: 'Admin access required',
            code: 'ADMIN_REQUIRED'
          }
        });
      }

      console.log(`✅ Admin access granted for user: ${req.user.id}`);
      next();
    });
  } catch (error) {
    console.error('❌ Admin auth error:', error);
    res.status(403).json({
      success: false,
      error: {
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      }
    });
  }
};

// Staff-only middleware that verifies staff role
const requireStaff = async (req, res, next) => {
  try {
    // First ensure user is authenticated
    await requireAuth(req, res, () => {
      // Check if user has staff role
      if (req.user?.role !== 'staff') {
        console.log(`❌ Access denied: User ${req.user?.id} has role "${req.user?.role}" but "staff" required`);
        return res.status(403).json({
          success: false,
          error: {
            message: 'Staff access required. Only staff members can upload files.',
            code: 'STAFF_REQUIRED'
          }
        });
      }

      console.log(`✅ Staff access granted for user: ${req.user.id}`);
      next();
    });
  } catch (error) {
    console.error('❌ Staff auth error:', error);
    res.status(403).json({
      success: false,
      error: {
        message: 'Staff access required',
        code: 'STAFF_REQUIRED'
      }
    });
  }
};

// Staff or Admin middleware - allows both staff and admin roles
const requireStaffOrAdmin = async (req, res, next) => {
  try {
    // First ensure user is authenticated
    await requireAuth(req, res, () => {
      // Check if user has staff or admin role
      if (req.user?.role !== 'staff' && req.user?.role !== 'admin') {
        console.log(`❌ Access denied: User ${req.user?.id} has role "${req.user?.role}" but "staff" or "admin" required`);
        return res.status(403).json({
          success: false,
          error: {
            message: 'Staff or admin access required',
            code: 'STAFF_OR_ADMIN_REQUIRED'
          }
        });
      }

      console.log(`✅ Staff/Admin access granted for user: ${req.user.id}`);
      next();
    });
  } catch (error) {
    console.error('❌ Staff/Admin auth error:', error);
    res.status(403).json({
      success: false,
      error: {
        message: 'Staff or admin access required',
        code: 'STAFF_OR_ADMIN_REQUIRED'
      }
    });
  }
};

// Validate user access middleware - users can access their own data, unless they're admin
const validateUserAccess = (req, res, next) => {
  const { clerkUserId } = req.params;

  // Users can only access their own data, unless they're admin
  if (req.user?.id !== clerkUserId && req.user?.role !== 'admin') {
    console.log(`❌ Access denied: User ${req.user?.id} tried to access data for ${clerkUserId}`);
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      }
    });
  }

  console.log(`✅ Access granted: User ${req.user?.id} accessing data for ${clerkUserId}`);
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireStaff,
  requireStaffOrAdmin,
  validateUserAccess,
};