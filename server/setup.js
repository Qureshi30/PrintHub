#!/usr/bin/env node

/**
 * PrintHub Server Setup Script
 * This script helps set up the MongoDB database with initial data
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./src/models/User');
const Printer = require('./src/models/Printer');
const PrintJob = require('./src/models/PrintJob');
const Notification = require('./src/models/Notification');
const AdminLog = require('./src/models/AdminLog');

// Sample data
const samplePrinters = [
  {
    name: 'Library Printer A',
    location: 'Main Library - Ground Floor',
    description: 'High-speed black and white printer for documents',
    status: 'online',
    specifications: {
      maxPaperSize: 'A4',
      supportedPaperTypes: ['A4', 'Letter'],
      colorSupport: false,
      duplexSupport: true,
      maxCopies: 100
    },
    supplies: {
      inkLevel: { black: 85, cyan: 0, magenta: 0, yellow: 0 },
      paperLevel: 90,
      tonerLevel: 85
    },
    settings: {
      autoQueueProcessing: true,
      maxQueueSize: 50,
      estimatedPrintSpeed: 25
    }
  },
  {
    name: 'Library Printer B',
    location: 'Main Library - Second Floor',
    description: 'Color printer for presentations and graphics',
    status: 'online',
    specifications: {
      maxPaperSize: 'A3',
      supportedPaperTypes: ['A4', 'A3', 'Letter'],
      colorSupport: true,
      duplexSupport: true,
      maxCopies: 50
    },
    supplies: {
      inkLevel: { black: 70, cyan: 65, magenta: 60, yellow: 55 },
      paperLevel: 75,
      tonerLevel: 70
    },
    settings: {
      autoQueueProcessing: true,
      maxQueueSize: 30,
      estimatedPrintSpeed: 15
    }
  },
  {
    name: 'Computer Lab Printer',
    location: 'Computer Science Building - Lab 101',
    description: 'Student lab printer for assignments',
    status: 'online',
    specifications: {
      maxPaperSize: 'A4',
      supportedPaperTypes: ['A4', 'Letter'],
      colorSupport: false,
      duplexSupport: true,
      maxCopies: 20
    },
    supplies: {
      inkLevel: { black: 45, cyan: 0, magenta: 0, yellow: 0 },
      paperLevel: 30,
      tonerLevel: 45
    },
    settings: {
      autoQueueProcessing: true,
      maxQueueSize: 25,
      estimatedPrintSpeed: 20
    }
  },
  {
    name: 'Admin Office Printer',
    location: 'Administration Building - Office 201',
    description: 'High-quality printer for official documents',
    status: 'maintenance',
    specifications: {
      maxPaperSize: 'A3',
      supportedPaperTypes: ['A4', 'A3', 'Letter', 'Legal'],
      colorSupport: true,
      duplexSupport: true,
      maxCopies: 100
    },
    supplies: {
      inkLevel: { black: 95, cyan: 90, magenta: 85, yellow: 80 },
      paperLevel: 95,
      tonerLevel: 95
    },
    settings: {
      autoQueueProcessing: false,
      maxQueueSize: 10,
      estimatedPrintSpeed: 30
    }
  }
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Starting PrintHub Database Setup...\n');

    // Connect to database
    await connectDB();

    // Create indexes
    console.log('📊 Creating database indexes...');
    await Promise.all([
      User.createIndexes(),
      Printer.createIndexes(),
      PrintJob.createIndexes(),
      Notification.createIndexes(),
      AdminLog.createIndexes()
    ]);
    console.log('✅ Database indexes created\n');

    // Check if printers already exist
    const existingPrinters = await Printer.countDocuments();
    if (existingPrinters === 0) {
      console.log('🖨️ Adding sample printers...');
      await Printer.insertMany(samplePrinters);
      console.log(`✅ Added ${samplePrinters.length} sample printers\n`);
    } else {
      console.log(`ℹ️ Found ${existingPrinters} existing printers, skipping sample data\n`);
    }

    // Display setup information
    console.log('📋 Setup Summary:');
    console.log(`   • Printers: ${await Printer.countDocuments()}`);
    console.log(`   • Users: ${await User.countDocuments()}`);
    console.log(`   • Print Jobs: ${await PrintJob.countDocuments()}`);
    console.log(`   • Notifications: ${await Notification.countDocuments()}`);
    console.log(`   • Admin Logs: ${await AdminLog.countDocuments()}\n`);

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Copy .env.example to .env and fill in your configuration');
    console.log('   2. Set up your Cloudinary account and add credentials');
    console.log('   3. Configure your Clerk authentication keys');
    console.log('   4. Start the server with: npm run dev');
    console.log('   5. Test the API endpoints with your frontend\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
PrintHub Database Setup Script

Usage: node setup.js [options]

Options:
  --help, -h     Show this help message
  --reset        Reset database (WARNING: This will delete all data)
  --env          Create .env file from .env.example

Examples:
  node setup.js              # Normal setup
  node setup.js --reset      # Reset and setup
  node setup.js --env        # Create .env file
  `);
  process.exit(0);
}

if (args.includes('--reset')) {
  console.log('⚠️ WARNING: This will delete ALL data in the database!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  setTimeout(async () => {
    try {
      await connectDB();
      await mongoose.connection.db.dropDatabase();
      console.log('🗑️ Database reset completed\n');
      await setupDatabase();
    } catch (error) {
      console.error('❌ Reset failed:', error);
      process.exit(1);
    }
  }, 5000);
} else if (args.includes('--env')) {
  const fs = require('fs');
  const path = require('path');
  
  const envExample = path.join(__dirname, '.env.example');
  const envFile = path.join(__dirname, '.env');
  
  if (fs.existsSync(envFile)) {
    console.log('ℹ️ .env file already exists');
  } else if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envFile);
    console.log('✅ Created .env file from .env.example');
    console.log('📝 Please edit .env file with your configuration');
  } else {
    console.log('❌ .env.example file not found');
  }
} else {
  setupDatabase();
}
