const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const jwt = require('jsonwebtoken');

// Simple auth middleware that extracts user from Clerk
const requireAuth = (req, res, next) => {
  // For development - simple token extraction
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No auth header or invalid format');
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    });
  }

  // Extract the token
  const token = authHeader.substring(7);
  
  try {
    // For development, decode the JWT without verification to get user ID
    // In production, you'd verify this with Clerk's public key
    let decoded = null;
    let userId = 'user_temp_id';
    
    try {
      decoded = jwt.decode(token);
      userId = decoded?.sub || decoded?.user_id || decoded?.userId || 'user_temp_id';
    } catch (decodeError) {
      console.log('⚠️ JWT decode failed, using temp user ID:', decodeError.message);
      // Continue with temp user ID for development
    }
    
    console.log('🔐 Auth middleware - user ID:', userId);
    
    req.auth = {
      userId: userId,
      token: token
    };

    next();
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

// Admin auth middleware
const requireAdmin = async (req, res, next) => {
  try {
    // First run regular auth
    requireAuth(req, res, () => {
      // Check if user is admin (this would come from your user database)
      // For now, we'll assume all authenticated users can access admin routes
      req.user = { role: 'admin' }; // This should come from your database
      next();
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(403).json({
      success: false,
      error: {
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      }
    });
  }
};

// Validate user access middleware
const validateUserAccess = (req, res, next) => {
  const { clerkUserId } = req.params;
  
  // Users can only access their own data, unless they're admin
  if (req.auth.userId !== clerkUserId && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      }
    });
  }

  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  validateUserAccess,
};