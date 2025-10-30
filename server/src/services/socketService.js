// Socket.io configuration for real-time printer monitoring and notifications
const socketIo = require('socket.io');
const PrintJob = require('../models/PrintJob');
const Printer = require('../models/Printer');

let io;
const userSockets = new Map(); // Map of userId -> socketId

const initializeSocketIO = (server) => {
  io = socketIo(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:8082',
        'https://printhub.vercel.app',
        'https://printhub1.vercel.app',
        /https:\/\/printhub.*\.vercel\.app$/
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Handle user registration (for print job notifications)
    socket.on('register', ({ userId }) => {
      if (userId) {
        userSockets.set(userId, socket.id);
        socket.userId = userId;
        socket.join(userId); // Join user-specific room
        console.log(`✅ User "${userId}" registered with socket ${socket.id}, joined room "${userId}"`);
        console.log(`📋 Currently registered users:`, Array.from(userSockets.keys()));
      }
    });

    // Join admin room for admin-specific notifications
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`👨‍💼 Admin joined: ${socket.id}`);
    });

    // Join user room for user-specific notifications (legacy support)
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      socket.join(userId); // Also join without prefix for new system
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      console.log(`👤 User ${userId} joined: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log(`❌ User ${socket.userId} disconnected: ${socket.id}`);
      } else {
        console.log(`❌ Client disconnected: ${socket.id}`);
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Client reconnected after ${attemptNumber} attempts: ${socket.id}`);
    });
  });

  console.log('✅ Socket.IO server initialized');
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

// New notification functions for print jobs and payments

// Emit print job completed event to specific user
const emitPrintJobCompleted = (userId, jobData) => {
  if (!io) {
    console.error('❌ Socket.IO not initialized');
    return;
  }

  console.log('🔔 EMIT NOTIFICATION:', {
    event: 'print-job-completed',
    targetRoom: userId,
    fileName: jobData.fileName,
    jobId: jobData.jobId || jobData._id,
    registeredUsers: Array.from(userSockets.keys()),
    hasSocketForUser: userSockets.has(userId)
  });

  const eventData = {
    jobId: jobData.jobId || jobData._id,
    fileName: jobData.fileName,
    printerName: jobData.printerName,
    completedAt: jobData.completedAt || new Date().toISOString(),
    status: 'completed'
  };

  io.to(userId).emit('print-job-completed', eventData);

  console.log(`📤 Emitted print-job-completed to room "${userId}":`, eventData);
};

// Emit print job failed event to specific user
const emitPrintJobFailed = (userId, jobData) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  io.to(userId).emit('print-job-failed', {
    jobId: jobData.jobId || jobData._id,
    fileName: jobData.fileName,
    printerName: jobData.printerName,
    error: jobData.error || 'Unknown error',
    failedAt: new Date().toISOString(),
    status: 'failed'
  });

  console.log(`📤 Emitted print-job-failed to user ${userId}: ${jobData.fileName}`);
};

// Emit print job terminated event to specific user
const emitPrintJobTerminated = (userId, jobData) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  io.to(userId).emit('print-job-terminated', {
    jobId: jobData.jobId || jobData._id,
    fileName: jobData.fileName,
    printerName: jobData.printerName,
    terminatedAt: new Date().toISOString(),
    status: 'terminated'
  });

  console.log(`📤 Emitted print-job-terminated to user ${userId}: ${jobData.fileName}`);
};

// Emit cash payment approved event to specific user
const emitCashPaymentApproved = (userId, paymentData) => {
  if (!io) {
    console.error('Socket.IO not initialized');
    return;
  }

  io.to(userId).emit('cash-payment-approved', {
    requestId: paymentData.requestId || paymentData._id,
    amount: paymentData.amount,
    jobId: paymentData.jobId,
    approvedAt: paymentData.approvedAt || new Date().toISOString()
  });

  console.log(`📤 Emitted cash-payment-approved to user ${userId}: ₹${paymentData.amount}`);
};

module.exports = {
  initializeSocketIO,
  emitPrinterError,
  emitJobPaused,
  emitJobResumed,
  emitPrinterStatusUpdate,
  emitPrintJobCompleted,
  emitPrintJobFailed,
  emitPrintJobTerminated,
  emitCashPaymentApproved,
  getIO: () => io
};
