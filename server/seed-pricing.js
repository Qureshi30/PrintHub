/**
 * Pricing Configuration Seed Script
 * 
 * This script initializes the database with default pricing configuration.
 * 
 * Usage:
 *   node seed-pricing.js
 */

const mongoose = require('mongoose');
const readline = require('node:readline');
require('dotenv').config();

const PricingConfig = require('./src/models/PricingConfig');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

// Default pricing configuration
const defaultPricingConfig = {
  name: 'Default Pricing',
  baseRates: {
    blackAndWhite: 2.00,  // ₹2.00 per page for B&W
    color: 5.00           // ₹5.00 per page for color
  },
  paperSurcharges: {
    a4: 0.00,      // No surcharge for A4 (standard)
    a3: 1.00,      // ₹1.00 extra per page for A3
    letter: 0.50,  // ₹0.50 extra per page for Letter
    legal: 0.75,   // ₹0.75 extra per page for Legal
    certificate: 2.00  // ₹2.00 extra per page for Certificate
  },
  discounts: {
    duplexPercentage: 10  // 10% discount for duplex printing
  },
  isActive: true,
  description: 'Standard pricing configuration for PrintHub'
};

async function main() {
  try {
    console.log('💰 PrintHub Pricing Configuration Seed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub');
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Check if pricing configuration already exists
    const existingConfig = await PricingConfig.findOne({ isActive: true });
    
    if (existingConfig) {
      console.log('⚠️  Active pricing configuration already exists:');
      console.log(`   Name: ${existingConfig.name}`);
      console.log(`   B&W Rate: ₹${existingConfig.baseRates.blackAndWhite}`);
      console.log(`   Color Rate: ₹${existingConfig.baseRates.color}`);
      console.log(`   Created: ${existingConfig.createdAt.toDateString()}`);
      console.log('');
      
      const shouldReplace = await question('Do you want to replace it with default configuration? (y/N): ');
      
      if (shouldReplace.toLowerCase() !== 'y' && shouldReplace.toLowerCase() !== 'yes') {
        console.log('📋 Keeping existing configuration. Exiting...');
        process.exit(0);
      }
      
      // Deactivate existing configuration
      await PricingConfig.updateMany({}, { isActive: false });
      console.log('✅ Deactivated existing pricing configuration');
    }

    console.log('🚀 Creating default pricing configuration...');
    console.log('');
    console.log('📋 Default Configuration:');
    console.log(`   • Black & White: ₹${defaultPricingConfig.baseRates.blackAndWhite} per page`);
    console.log(`   • Color: ₹${defaultPricingConfig.baseRates.color} per page`);
    console.log('');
    console.log('📄 Paper Surcharges:');
    console.log(`   • A4: +₹${defaultPricingConfig.paperSurcharges.a4}`);
    console.log(`   • A3: +₹${defaultPricingConfig.paperSurcharges.a3}`);
    console.log(`   • Letter: +₹${defaultPricingConfig.paperSurcharges.letter}`);
    console.log(`   • Legal: +₹${defaultPricingConfig.paperSurcharges.legal}`);
    console.log(`   • Certificate: +₹${defaultPricingConfig.paperSurcharges.certificate}`);
    console.log('');
    console.log('💸 Discounts:');
    console.log(`   • Duplex Printing: ${defaultPricingConfig.discounts.duplexPercentage}% off`);
    console.log('');

    const shouldProceed = await question('Proceed with this configuration? (Y/n): ');
    
    if (shouldProceed.toLowerCase() === 'n' || shouldProceed.toLowerCase() === 'no') {
      console.log('❌ Cancelled. No changes made.');
      process.exit(0);
    }

    // Create the pricing configuration
    const newPricingConfig = new PricingConfig(defaultPricingConfig);
    await newPricingConfig.save();

    console.log('');
    console.log('✅ Default pricing configuration created successfully!');
    console.log(`   Configuration ID: ${newPricingConfig._id}`);
    console.log(`   Created at: ${newPricingConfig.createdAt}`);
    console.log('');
    console.log('🎉 Your PrintHub pricing system is now ready!');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Visit /admin/pricing in your admin dashboard');
    console.log('   2. Customize the pricing as needed');
    console.log('   3. Test the pricing on student pages');
    console.log('');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    rl.close();
  }
}

// Handle process interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Process interrupted. Cleaning up...');
  await mongoose.connection.close();
  rl.close();
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});