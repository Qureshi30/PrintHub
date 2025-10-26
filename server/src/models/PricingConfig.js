const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema({
  baseRates: {
    blackAndWhite: {
      type: Number,
      required: true,
      default: 2.00,
      min: [0, 'Black and white rate cannot be negative'],
      validate: {
        validator: function(value) {
          return value >= 0 && value <= 100;
        },
        message: 'Black and white rate must be between 0 and 100'
      }
    },
    color: {
      type: Number,
      required: true,
      default: 5.00,
      min: [0, 'Color rate cannot be negative'],
      validate: {
        validator: function(value) {
          return value >= 0 && value <= 100;
        },
        message: 'Color rate must be between 0 and 100'
      }
    }
  },
  paperSurcharges: {
    a4: {
      type: Number,
      default: 0,
      min: [0, 'A4 surcharge cannot be negative']
    },
    a3: {
      type: Number,
      default: 3.00,
      min: [0, 'A3 surcharge cannot be negative']
    },
    letter: {
      type: Number,
      default: 0.50,
      min: [0, 'Letter surcharge cannot be negative']
    },
    legal: {
      type: Number,
      default: 1.00,
      min: [0, 'Legal surcharge cannot be negative']
    },
    certificate: {
      type: Number,
      default: 5.00,
      min: [0, 'Certificate surcharge cannot be negative']
    }
  },
  discounts: {
    duplexPercentage: {
      type: Number,
      default: 10,
      min: [0, 'Duplex discount cannot be negative'],
      max: [100, 'Duplex discount cannot exceed 100%'],
      validate: {
        validator: function(value) {
          return value >= 0 && value <= 100;
        },
        message: 'Duplex discount percentage must be between 0 and 100'
      }
    }
  },
  lastUpdatedBy: {
    type: String,
    default: 'system'
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Version tracking for pricing changes
  version: {
    type: Number,
    default: 1
  },
  // Optional description for pricing changes
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Pre-save middleware to update version and timestamp
pricingConfigSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
    this.lastUpdatedAt = new Date();
  }
  next();
});

// Static method to get current active pricing
pricingConfigSchema.statics.getCurrentPricing = async function() {
  try {
    let pricing = await this.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    // If no pricing config exists, return default values
    if (!pricing) {
      pricing = {
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
        isActive: true,
        version: 1
      };
    }
    
    return pricing;
  } catch (error) {
    console.error('Error fetching current pricing:', error);
    // Return default pricing in case of error
    return {
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
      isActive: true,
      version: 1
    };
  }
};

// Instance method to deactivate current pricing
pricingConfigSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to calculate total cost for a print job
pricingConfigSchema.methods.calculatePrintCost = function(options) {
  const {
    pageCount,
    isColor = false,
    paperSize = 'a4',
    isDuplex = false
  } = options;

  // Get base rate
  const baseRate = isColor ? this.baseRates.color : this.baseRates.blackAndWhite;
  
  // Calculate base cost
  let totalCost = pageCount * baseRate;
  
  // Add paper surcharge
  const paperSurcharge = this.paperSurcharges[paperSize.toLowerCase()] || 0;
  totalCost += paperSurcharge;
  
  // Apply duplex discount
  if (isDuplex) {
    const duplexDiscount = totalCost * (this.discounts.duplexPercentage / 100);
    totalCost -= duplexDiscount;
  }
  
  return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
};

// Index for faster queries
pricingConfigSchema.index({ isActive: 1, createdAt: -1 });
pricingConfigSchema.index({ lastUpdatedAt: -1 });

const PricingConfig = mongoose.model('PricingConfig', pricingConfigSchema);

module.exports = PricingConfig;