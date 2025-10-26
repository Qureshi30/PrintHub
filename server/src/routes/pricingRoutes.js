const express = require('express');
const { body, query, validationResult } = require('express-validator');
const {
  getCurrentPricing,
  calculatePrintCost
} = require('../controllers/pricingController');

const router = express.Router();

console.log('🔧 Loading pricing routes...');

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

// ============================================================================
// PUBLIC PRICING ROUTES
// ============================================================================

/**
 * @route   GET /pricing/current
 * @desc    Get current pricing configuration (Public)
 * @access  Public
 */
router.get('/current', getCurrentPricing);

/**
 * @route   GET /pricing/calculate
 * @desc    Calculate print cost preview (Public)
 * @access  Public
 * @query   pageCount, isColor, paperSize, isDuplex
 */
router.get('/calculate',
  [
    query('pageCount')
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page count must be between 1 and 1000'),
    query('isColor')
      .optional()
      .isBoolean()
      .withMessage('isColor must be a boolean value'),
    query('paperSize')
      .optional()
      .isIn(['a4', 'a3', 'letter', 'legal', 'certificate'])
      .withMessage('Invalid paper size'),
    query('isDuplex')
      .optional()
      .isBoolean()
      .withMessage('isDuplex must be a boolean value')
  ],
  validateRequest,
  calculatePrintCost
);

console.log('💰 Public pricing routes registered');

module.exports = router;