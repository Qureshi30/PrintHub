#!/usr/bin/env node

/**
 * PrintHub Database Initialization Script
 * Run this script to set up printers and initialize the database
 * 
 * Usage: node scripts/initDatabase.js
 */

const mongoose = require('mongoose');
const printerService = require('../src/services/printerService');
require('dotenv').config();

async function initializeDatabase() {
  console.log('🚀 PrintHub Database Initialization Starting...');
  console.log('===============================================');
  
  try {
    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Initialize printers
    console.log('\n🖨️ Initializing printer database...');
    const printerResult = await printerService.initializePrinters();
    
    if (printerResult) {
      console.log('✅ Printer database initialized successfully');
    } else {
      console.log('❌ Failed to initialize printer database');
      process.exit(1);
    }

    // Display summary
    console.log('\n📋 Database Initialization Summary:');
    console.log('=====================================');
    
    const Printer = require('../src/models/Printer');
    const printers = await Printer.find({}).select('name status location pricing.baseCostPerPage');
    
    console.log(`📊 Total Printers: ${printers.length}`);
    printers.forEach(printer => {
      console.log(`   • ${printer.name}`);
      console.log(`     Location: ${printer.location}`);
      console.log(`     Status: ${printer.status}`);
      if (printer.pricing && printer.pricing.baseCostPerPage) {
        console.log(`     Cost: ₹${printer.pricing.baseCostPerPage}/page`);
      } else {
        console.log(`     Cost: ₹1.00/page (default)`);
      }
      console.log('');
    });

    console.log('🎉 Database initialization completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Your printers are ready to accept print jobs');
    console.log('3. Collection codes will be generated automatically');
    console.log('4. Email notifications will be sent on job completion');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('\n✨ Initialization complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };