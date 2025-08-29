const mongoose = require('mongoose');
const Printer = require('./src/models/Printer');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/PrintHub');
    console.log('📦 MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed printers
const seedPrinters = async () => {
  try {
    // Check if printers already exist
    const existingPrinters = await Printer.find();
    console.log('📄 Existing printers:', existingPrinters.length);

    if (existingPrinters.length === 0) {
      console.log('🌱 Seeding printers...');
      
      const printers = [
        {
          name: 'HP LaserJet Pro MFP M428fdw',
          model: 'HP M428fdw',
          location: 'Computer Lab - Room 101',
          type: 'laser',
          capabilities: {
            color: false,
            duplex: true,
            stapling: false,
            binding: false
          },
          specs: {
            maxResolution: '1200x1200 dpi',
            printSpeed: {
              black: 38,
              color: null
            },
            paperSizes: ['A4', 'A5', 'Letter', 'Legal'],
            paperTypes: ['Plain', 'Recycled', 'Bond'],
            connectivity: ['USB', 'Ethernet', 'WiFi']
          },
          status: 'online',
          isActive: true,
          queue: [],
          maintenance: {
            lastService: new Date('2024-01-15'),
            nextService: new Date('2024-07-15'),
            tonerLevel: 75,
            paperLevel: 100
          },
          costPerPage: {
            black: 0.05,
            color: null
          },
          adminNotes: 'Primary laser printer for documents'
        },
        {
          name: 'Canon PIXMA Pro-200',
          model: 'Canon Pro-200',
          location: 'Art Department - Room 205',
          type: 'inkjet',
          capabilities: {
            color: true,
            duplex: false,
            stapling: false,
            binding: false
          },
          specs: {
            maxResolution: '4800x2400 dpi',
            printSpeed: {
              black: 10,
              color: 8
            },
            paperSizes: ['A4', 'A3', 'Letter', '13x19'],
            paperTypes: ['Plain', 'Photo', 'Canvas', 'Fine Art'],
            connectivity: ['USB', 'WiFi']
          },
          status: 'online',
          isActive: true,
          queue: [],
          maintenance: {
            lastService: new Date('2024-02-01'),
            nextService: new Date('2024-08-01'),
            tonerLevel: null,
            paperLevel: 90,
            inkLevels: {
              black: 85,
              cyan: 70,
              magenta: 65,
              yellow: 80
            }
          },
          costPerPage: {
            black: 0.15,
            color: 0.45
          },
          adminNotes: 'High-quality photo and art printing'
        },
        {
          name: 'Brother HL-L3270CDW',
          model: 'Brother L3270CDW',
          location: 'Library - Information Desk',
          type: 'laser',
          capabilities: {
            color: true,
            duplex: true,
            stapling: false,
            binding: false
          },
          specs: {
            maxResolution: '2400x600 dpi',
            printSpeed: {
              black: 25,
              color: 25
            },
            paperSizes: ['A4', 'Letter', 'Legal'],
            paperTypes: ['Plain', 'Recycled', 'Cardstock'],
            connectivity: ['USB', 'Ethernet', 'WiFi']
          },
          status: 'online',
          isActive: true,
          queue: [],
          maintenance: {
            lastService: new Date('2024-01-30'),
            nextService: new Date('2024-07-30'),
            tonerLevel: 60,
            paperLevel: 85
          },
          costPerPage: {
            black: 0.08,
            color: 0.25
          },
          adminNotes: 'Color laser for presentations and reports'
        }
      ];

      await Printer.insertMany(printers);
      console.log('✅ Seeded', printers.length, 'printers');
    } else {
      console.log('📄 Printers already exist, updating status to online...');
      
      // Update existing printers to be online
      await Printer.updateMany(
        { isActive: true }, 
        { status: 'online' }
      );
      console.log('✅ Updated printer statuses');
    }

    // Show current printers
    const allPrinters = await Printer.find().select('name location status isActive');
    console.log('📋 Current printers:');
    allPrinters.forEach(printer => {
      console.log(`  - ${printer.name} (${printer.location}) - ${printer.status} - ${printer.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await seedPrinters();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

main();
