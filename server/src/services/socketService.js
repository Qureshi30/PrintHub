// Socket.io configuration for real-time printer monitoring
const socketIo = require('socket.io');
const PrintJob = require('../models/PrintJob');
const Printer = require('../models/Printer');

let io;

const initializeSocketIO = (server) => {
  io = socketIo(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join admin room for admin-specific notifications
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`👨‍💼 Admin joined: ${socket.id}`);
    });

    // Join user room for user-specific notifications
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit printer error to admin dashboard
const emitPrinterError = (printerData) => {
  if (io) {
    io.to('admin_room').emit('printer_error', {
      printerId: printerData.printerId,
      printerName: printerData.printerName,
      jobId: printerData.jobId,
      reason: printerData.reason,
      details: printerData.details,
      timestamp: new Date()
    });
    console.log(`🚨 Emitted printer error: ${printerData.printerName} - ${printerData.reason}`);
  }
};

// Emit job paused event
const emitJobPaused = (jobData) => {
  if (io) {
    // Notify admin
    io.to('admin_room').emit('job_paused', {
      jobId: jobData.jobId,
      fileName: jobData.fileName,
      printerName: jobData.printerName,
      reason: jobData.reason,
      details: jobData.details,
      timestamp: new Date()
    });

    // Notify user
    io.to(`user_${jobData.userId}`).emit('job_paused', {
      jobId: jobData.jobId,
      fileName: jobData.fileName,
      reason: jobData.reason,
      details: jobData.details,
      timestamp: new Date()
    });

    console.log(`⏸️ Emitted job paused: ${jobData.jobId} - ${jobData.reason}`);
  }
};

// Emit job resumed event
const emitJobResumed = (jobData) => {
  if (io) {
    // Notify admin
    io.to('admin_room').emit('job_resumed', {
      jobId: jobData.jobId,
      fileName: jobData.fileName,
      printerName: jobData.printerName,
      timestamp: new Date()
    });

    // Notify user
    io.to(`user_${jobData.userId}`).emit('job_resumed', {
      jobId: jobData.jobId,
      fileName: jobData.fileName,
      timestamp: new Date()
    });

    console.log(`▶️ Emitted job resumed: ${jobData.jobId}`);
  }
};

// Emit printer status update
const emitPrinterStatusUpdate = (printerData) => {
  if (io) {
    io.to('admin_room').emit('printer_status_update', {
      printerId: printerData.printerId,
      printerName: printerData.printerName,
      status: printerData.status,
      inkLevel: printerData.inkLevel,
      paperLevel: printerData.paperLevel,
      timestamp: new Date()
    });
  }
};

module.exports = {
  initializeSocketIO,
  emitPrinterError,
  emitJobPaused,
  emitJobResumed,
  emitPrinterStatusUpdate,
  getIO: () => io
};
