const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// Mock auth middleware for testing
const mockAdminAuth = (req, res, next) => {
  req.user = {
    id: 'test-admin-user',
    userId: 'test-admin-user',
    role: 'admin'
  };
  next();
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import pricing controller
const { updatePricing, resetToDefaults } = require('./src/controllers/pricingController');

// Test routes
app.put('/test-pricing', mockAdminAuth, updatePricing);
app.post('/test-reset', mockAdminAuth, resetToDefaults);

const PORT = 3002;

async function testPricingUpdates() {
  console.log('🧪 Testing Pricing Management...\n');
  
  const server = app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);
  });

  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // Test 1: Valid pricing update
    console.log('📝 Test 1: Valid pricing update');
    const validPricing = {
      baseRates: {
        blackAndWhite: 2.50,
        color: 6.00
      },
      paperSurcharges: {
        a4: 0,
        a3: 3.50,
        letter: 0.75,
        legal: 1.25,
        certificate: 5.50
      },
      discounts: {
        duplexPercentage: 15
      },
      description: 'Test pricing update'
    };

    const response1 = await fetch(`http://localhost:${PORT}/test-pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPricing)
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ Valid pricing update successful');
      console.log('   Created pricing ID:', result1.data._id);
    } else {
      const error1 = await response1.json();
      console.log('❌ Valid pricing update failed:');
      console.log('   Status:', response1.status);
      console.log('   Error:', error1.message);
      if (error1.errors) {
        console.log('   Validation errors:', error1.errors);
      }
    }

    console.log('');

    // Test 2: Reset to defaults
    console.log('📝 Test 2: Reset to defaults');
    const response2 = await fetch(`http://localhost:${PORT}/test-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ Reset to defaults successful');
      console.log('   Created pricing ID:', result2.data._id);
    } else {
      const error2 = await response2.json();
      console.log('❌ Reset to defaults failed:');
      console.log('   Status:', response2.status);
      console.log('   Error:', error2.message);
      if (error2.errors) {
        console.log('   Validation errors:', error2.errors);
      }
    }

    console.log('');

    // Test 3: Invalid pricing update (should fail validation)
    console.log('📝 Test 3: Invalid pricing update (should fail)');
    const invalidPricing = {
      baseRates: {
        blackAndWhite: -1, // Invalid: negative
        color: 150         // Invalid: > 100
      },
      paperSurcharges: {
        a4: -5,           // Invalid: negative
        a3: 3.00,
        letter: 0.50,
        legal: 1.00,
        certificate: 5.00
      },
      discounts: {
        duplexPercentage: 150 // Invalid: > 100
      }
    };

    const response3 = await fetch(`http://localhost:${PORT}/test-pricing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPricing)
    });

    if (!response3.ok) {
      const error3 = await response3.json();
      console.log('✅ Invalid pricing correctly rejected');
      console.log('   Status:', response3.status);
      console.log('   Error:', error3.message);
      if (error3.errors) {
        console.log('   Validation errors:', error3.errors);
      }
    } else {
      console.log('❌ Invalid pricing was incorrectly accepted');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    server.close();
    mongoose.connection.close();
    console.log('\n🔚 Tests completed');
  }
}

// Check if the PricingConfig model exists and has proper validation
async function checkPricingModel() {
  try {
    const PricingConfig = require('./src/models/PricingConfig');
    console.log('✅ PricingConfig model loaded successfully');
    
    // Test model validation
    const testPricing = new PricingConfig({
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
      lastUpdatedBy: 'test-user'
    });

    // Validate without saving
    const validationError = testPricing.validateSync();
    if (validationError) {
      console.log('❌ Model validation failed:', validationError.message);
    } else {
      console.log('✅ Model validation passed');
    }

  } catch (error) {
    console.error('❌ Error loading PricingConfig model:', error.message);
  }
}

console.log('🚀 PrintHub Pricing Management Tester');
console.log('=====================================\n');

checkPricingModel().then(() => {
  testPricingUpdates();
});