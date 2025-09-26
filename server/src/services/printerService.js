const mongoose = require('mongoose');
const Printer = require('../models/Printer');
require('dotenv').config();

/**
 * Initialize printer database with real HP LaserJet and PDF printers
 */
const initializePrinters = async () => {
  try {
    console.log('🖨️ Initializing printer database...');
    
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('📊 Connected to MongoDB for printer initialization');
    }

    // Define our real printers matching the frontend
    const printersToAdd = [
      {
        name: 'HP LaserJet Pro M201-M202',
        location: 'Main Library - Ground Floor',
        description: 'High-speed monochrome laser printer for general student use',
        status: 'online',
        specifications: {
          maxPaperSize: 'Legal',
          supportedPaperTypes: ['A4', 'Letter', 'Legal'],
          colorSupport: false,
          duplexSupport: true,
          maxCopies: 99,
          printSpeed: 25, // pages per minute
          resolution: '1200x1200'
        },
        pricing: {
          baseCostPerPage: 1.00, // ₹1 per page
          colorCostPerPage: 0, // Not applicable - monochrome only
          duplexCostPerPage: 0, // No extra cost for duplex
          currency: 'INR'
        },
        settings: {
          autoQueueProcessing: true,
          maxQueueSize: 50,
          maintenanceMode: false,
          allowStudentAccess: true
        },
        systemInfo: {
          driverName: 'HP LaserJet Pro M201-M202 PCL 6',
          connectionType: 'Network',
          ipAddress: '192.168.1.101', // Example IP
          macAddress: '00:11:22:33:44:55'
        }
      },
      {
        name: 'Microsoft Print to PDF',
        location: 'Digital Download - Instant Access',
        description: 'Virtual printer for PDF generation and digital delivery',
        status: 'online',
        specifications: {
          maxPaperSize: 'A3',
          supportedPaperTypes: ['A4', 'A3', 'Letter', 'Legal', 'Certificate'],
          colorSupport: true,
          duplexSupport: false, // Not applicable for PDF
          maxCopies: 1, // PDF generation
          printSpeed: 999, // Instant
          resolution: 'Digital'
        },
        pricing: {
          baseCostPerPage: 0.50, // ₹0.50 per page for digital
          colorCostPerPage: 0, // No extra cost for color in PDF
          duplexCostPerPage: 0,
          currency: 'INR'
        },
        settings: {
          autoQueueProcessing: true,
          maxQueueSize: 100,
          maintenanceMode: false,
          allowStudentAccess: true
        },
        systemInfo: {
          driverName: 'Microsoft Print to PDF',
          connectionType: 'Virtual',
          ipAddress: 'localhost',
          macAddress: 'virtual'
        }
      },
      {
        name: 'HP LaserJet Pro M201 (Backup)',
        location: 'Computer Lab - Engineering Block',
        description: 'Backup monochrome printer for engineering students',
        status: 'online',
        specifications: {
          maxPaperSize: 'Letter',
          supportedPaperTypes: ['A4', 'Letter'],
          colorSupport: false,
          duplexSupport: true,
          maxCopies: 50,
          printSpeed: 25,
          resolution: '1200x1200'
        },
        pricing: {
          baseCostPerPage: 1.00,
          colorCostPerPage: 0,
          duplexCostPerPage: 0,
          currency: 'INR'
        },
        settings: {
          autoQueueProcessing: true,
          maxQueueSize: 30,
          maintenanceMode: false,
          allowStudentAccess: true
        },
        systemInfo: {
          driverName: 'HP LaserJet Pro M201 PCL 6',
          connectionType: 'Network',
          ipAddress: '192.168.1.102',
          macAddress: '00:11:22:33:44:56'
        }
      },
      {
        name: 'HP LaserJet Pro M202 (Admin)',
        location: 'Administrative Office',
        description: 'Administrative printer with restricted access',
        status: 'maintenance',
        specifications: {
          maxPaperSize: 'Legal',
          supportedPaperTypes: ['A4', 'Letter', 'Legal'],
          colorSupport: false,
          duplexSupport: true,
          maxCopies: 99,
          printSpeed: 25,
          resolution: '1200x1200'
        },
        pricing: {
          baseCostPerPage: 1.00,
          colorCostPerPage: 0,
          duplexCostPerPage: 0,
          currency: 'INR'
        },
        settings: {
          autoQueueProcessing: false, // Manual processing for admin
          maxQueueSize: 10,
          maintenanceMode: true,
          allowStudentAccess: false
        },
        systemInfo: {
          driverName: 'HP LaserJet Pro M202 PCL 6',
          connectionType: 'Network',
          ipAddress: '192.168.1.103',
          macAddress: '00:11:22:33:44:57'
        }
      }
    ];

    // Insert or update printers
    for (const printerData of printersToAdd) {
      try {
        const existingPrinter = await Printer.findOne({ name: printerData.name });
        
        if (existingPrinter) {
          await Printer.findOneAndUpdate({ name: printerData.name }, printerData, { new: true });
          console.log(`✅ Updated printer: ${printerData.name}`);
        } else {
          const newPrinter = new Printer(printerData);
          await newPrinter.save();
          console.log(`✅ Added new printer: ${printerData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error with printer ${printerData.name}:`, error.message);
      }
    }

    console.log('🎉 Printer database initialization completed!');
    return true;

  } catch (error) {
    console.error('❌ Failed to initialize printer database:', error);
    return false;
  }
};

/**
 * Get all available printers from database
 */
const getAvailablePrintersFromDB = async () => {
  try {
    const printers = await Printer.find({ 
      status: { $in: ['online', 'busy'] },
      'settings.allowStudentAccess': true 
    }).select('-queue -systemInfo').lean();
    
    return printers.map(printer => ({
      id: printer._id,
      name: printer.name,
      location: printer.location,
      status: printer.status,
      queueLength: printer.queue?.length || 0,
      capabilities: {
        color: printer.specifications.colorSupport,
        duplex: printer.specifications.duplexSupport,
        paperSizes: printer.specifications.supportedPaperTypes
      },
      pricing: printer.pricing,
      estimatedWait: (printer.queue?.length || 0) * 3 // 3 minutes per job estimate
    }));
  } catch (error) {
    console.error('❌ Error fetching printers from database:', error);
    return [];
  }
};

/**
 * Add job to printer queue
 */
const addJobToQueue = async (printerId, jobId) => {
  try {
    const printer = await Printer.findById(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    if (printer.queue.length >= printer.settings.maxQueueSize) {
      throw new Error(`Printer queue is full (max: ${printer.settings.maxQueueSize})`);
    }

    printer.queue.push(jobId);
    printer.status = printer.queue.length > 0 ? 'busy' : 'online';
    await printer.save();

    console.log(`📋 Added job ${jobId} to ${printer.name} queue (position: ${printer.queue.length})`);
    return { success: true, queuePosition: printer.queue.length };
  } catch (error) {
    console.error('❌ Error adding job to queue:', error);
    throw error;
  }
};

/**
 * Remove job from printer queue
 */
const removeJobFromQueue = async (printerId, jobId) => {
  try {
    const printer = await Printer.findById(printerId);
    if (!printer) {
      throw new Error(`Printer ${printerId} not found`);
    }

    printer.queue = printer.queue.filter(id => id.toString() !== jobId.toString());
    printer.status = printer.queue.length > 0 ? 'busy' : 'online';
    await printer.save();

    console.log(`📋 Removed job ${jobId} from ${printer.name} queue`);
    return { success: true, remainingJobs: printer.queue.length };
  } catch (error) {
    console.error('❌ Error removing job from queue:', error);
    throw error;
  }
};

/**
 * Get next job in queue for a printer
 */
const getNextJobInQueue = async (printerId) => {
  try {
    const printer = await Printer.findById(printerId).populate('queue');
    if (!printer || printer.queue.length === 0) {
      return null;
    }

    return printer.queue[0]; // First job in queue
  } catch (error) {
    console.error('❌ Error getting next job in queue:', error);
    return null;
  }
};

module.exports = {
  initializePrinters,
  getAvailablePrintersFromDB,
  addJobToQueue,
  removeJobFromQueue,
  getNextJobInQueue
};