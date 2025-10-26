const PricingConfig = require('../models/PricingConfig');
const { validationResult } = require('express-validator');

/**
 * Get current active pricing configuration
 * Available to both admin and regular users
 */
const getCurrentPricing = async (req, res) => {
  try {
    const pricing = await PricingConfig.getCurrentPricing();
    
    res.status(200).json({
      success: true,
      data: pricing,
      message: 'Current pricing retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting current pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve current pricing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update pricing configuration (Admin only)
 * Deactivates current config and creates new active config
 */
const updatePricing = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      baseRates,
      paperSurcharges,
      discounts,
      description
    } = req.body;

    // Get admin user ID from authentication middleware
    const adminUserId = req.user?.id || req.user?.userId;
    
    console.log('🔍 Admin user from auth middleware:', {
      id: req.user?.id,
      userId: req.user?.userId,
      email: req.user?.email,
      role: req.user?.role,
      fullName: req.user?.fullName
    });
    
    if (!adminUserId) {
      console.log('❌ No admin user ID found in request');
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required - user ID not found'
      });
    }

    console.log('✅ Using admin user ID:', adminUserId);

    // Deactivate current pricing config
    const currentPricing = await PricingConfig.findOne({ isActive: true });
    if (currentPricing) {
      await currentPricing.deactivate();
    }

    // Create new pricing configuration
    const newPricing = new PricingConfig({
      baseRates: {
        blackAndWhite: baseRates?.blackAndWhite || 2.00,
        color: baseRates?.color || 5.00
      },
      paperSurcharges: {
        a4: paperSurcharges?.a4 || 0,
        a3: paperSurcharges?.a3 || 3.00,
        letter: paperSurcharges?.letter || 0.50,
        legal: paperSurcharges?.legal || 1.00,
        certificate: paperSurcharges?.certificate || 5.00
      },
      discounts: {
        duplexPercentage: discounts?.duplexPercentage || 10
      },
      lastUpdatedBy: adminUserId,
      lastUpdatedAt: new Date(),
      isActive: true,
      description: description || 'Pricing updated by admin'
    });

    // Save new pricing configuration
    const savedPricing = await newPricing.save();

    res.status(200).json({
      success: true,
      data: savedPricing,
      message: 'Pricing configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating pricing:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update pricing configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get pricing history (Admin only)
 * Returns all pricing configurations sorted by date
 */
const getPricingHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await PricingConfig.countDocuments();
    
    // Get pricing history with pagination
    const pricingHistory = await PricingConfig.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        pricingHistory,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          hasNextPage,
          hasPrevPage,
          limit
        }
      },
      message: 'Pricing history retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting pricing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Reset pricing to default values (Admin only)
 * Creates a new active pricing config with default values
 */
const resetToDefaults = async (req, res) => {
  try {
    const adminUserId = req.user?.id || req.user?.userId;
    
    console.log('🔍 Admin user from auth middleware for reset:', {
      id: req.user?.id,
      userId: req.user?.userId,
      email: req.user?.email,
      role: req.user?.role,
      fullName: req.user?.fullName
    });
    
    if (!adminUserId) {
      console.log('❌ No admin user ID found in request for reset');
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required - user ID not found'
      });
    }

    console.log('✅ Using admin user ID for reset:', adminUserId);

    // Deactivate current pricing config
    const currentPricing = await PricingConfig.findOne({ isActive: true });
    if (currentPricing) {
      await currentPricing.deactivate();
    }

    // Create new pricing configuration with defaults
    const defaultPricing = new PricingConfig({
      baseRates: {
        blackAndWhite: 2.00,
        color: 5.00
      },
      paperSurcharges: {
        a4: 0,
        a3: 3.00,
        letter: 0.50,
        legal: 1.00,
        certificate: 5.00
      },
      discounts: {
        duplexPercentage: 10
      },
      lastUpdatedBy: adminUserId,
      lastUpdatedAt: new Date(),
      isActive: true,
      description: 'Reset to default pricing values'
    });

    const savedPricing = await defaultPricing.save();

    res.status(200).json({
      success: true,
      data: savedPricing,
      message: 'Pricing reset to default values successfully'
    });

  } catch (error) {
    console.error('Error resetting pricing to defaults:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset pricing to defaults',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Calculate print cost preview (Public endpoint for price preview)
 * Allows users to preview costs without creating a print job
 */
const calculatePrintCost = async (req, res) => {
  try {
    const {
      pageCount,
      isColor = false,
      paperSize = 'a4',
      isDuplex = false
    } = req.query;

    // Validate required parameters
    if (!pageCount || isNaN(pageCount) || pageCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid page count is required'
      });
    }

    const pricing = await PricingConfig.getCurrentPricing();
    
    // Calculate cost using the pricing model method
    const totalCost = pricing.calculatePrintCost ? 
      pricing.calculatePrintCost({
        pageCount: parseInt(pageCount),
        isColor: isColor === 'true',
        paperSize: paperSize.toLowerCase(),
        isDuplex: isDuplex === 'true'
      }) :
      // Fallback calculation if model method not available
      (() => {
        const baseRate = (isColor === 'true') ? pricing.baseRates.color : pricing.baseRates.blackAndWhite;
        let cost = parseInt(pageCount) * baseRate;
        const paperSurcharge = pricing.paperSurcharges[paperSize.toLowerCase()] || 0;
        cost += paperSurcharge;
        if (isDuplex === 'true') {
          cost -= cost * (pricing.discounts.duplexPercentage / 100);
        }
        return Math.round(cost * 100) / 100;
      })();

    res.status(200).json({
      success: true,
      data: {
        totalCost,
        breakdown: {
          baseRate: (isColor === 'true') ? pricing.baseRates.color : pricing.baseRates.blackAndWhite,
          pageCount: parseInt(pageCount),
          paperSurcharge: pricing.paperSurcharges[paperSize.toLowerCase()] || 0,
          duplexDiscount: (isDuplex === 'true') ? pricing.discounts.duplexPercentage : 0,
          isColor: isColor === 'true',
          paperSize,
          isDuplex: isDuplex === 'true'
        }
      },
      message: 'Print cost calculated successfully'
    });

  } catch (error) {
    console.error('Error calculating print cost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate print cost',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getCurrentPricing,
  updatePricing,
  getPricingHistory,
  resetToDefaults,
  calculatePrintCost
};