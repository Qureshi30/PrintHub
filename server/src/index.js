const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { startAllSchedulers } = require('./services/printScheduler');

// Import routes
const userRoutes = require('./routes/userRoutes');
const printJobRoutes = require('./routes/printJobRoutes');
const printerRoutes = require('./routes/printerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminLogRoutes = require('./routes/adminLogRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const queueRoutes = require('./routes/queueRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

// Import queue processor
const queueProcessor = require('./services/queueProcessor');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB (non-blocking)
connectDB().catch(err => {
  console.error('Initial MongoDB connection failed:', err.message);
  console.log('🚀 Server will start anyway. Database operations will retry automatically.');
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    // Add your Vercel deployment URLs
    'https://printhub.vercel.app',
    'https://printhub1.vercel.app',          // Your actual deployment
    'https://printhub-*.vercel.app',
    /https:\/\/printhub.*\.vercel\.app$/     // All PrintHub Vercel URLs
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.API_RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.API_RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'PrintHub Server API',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      users: '/api/users'
    }
  });
});

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'PrintHub API',
    version: '1.0.0'
  });
});

// Public routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'PrintHub API',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/print-jobs', printJobRoutes);
app.use('/api/printers', printerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin-logs', adminLogRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/payments', paymentRoutes);
// Webhook routes (no rate limiting for webhooks)
app.use('/webhooks', webhookRoutes);


console.log('✅ All API routes registered successfully');
console.log('📍 Admin routes available at: /api/admin/*');

// Serve static files (if any)
app.use(express.static('public'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PrintHub Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origins: Multiple localhost ports`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 MongoDB Connected: localhost`);
  console.log(`🔄 Queue API: http://localhost:${PORT}/api/queue`);
  
  // Start background schedulers for print job processing
  startAllSchedulers();
  
  // Start the print queue processor
  queueProcessor.start();
  console.log(`🖨️ Print queue processor started`);
});

module.exports = app;
