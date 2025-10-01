const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Modern MongoDB connection options for Atlas
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📦 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('📦 MongoDB reconnected');
    });

    // Graceful close on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📦 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Check if it's an Atlas IP whitelisting issue
    if (error.message.includes('IP') || error.message.includes('whitelist') || 
        error.message.includes('not allowed') || error.message.includes('connection')) {
      console.log('💡 This appears to be an IP whitelisting issue with MongoDB Atlas.');
      console.log('💡 Please add your current IP address to the Atlas IP whitelist:');
      console.log('💡 https://cloud.mongodb.com/v2#/security/network/accessList');
      console.log('💡 Or use 0.0.0.0/0 to allow all IPs (for development only)');
    }
    
    // Don't exit the process - let the app continue with connection retries
    console.log('🔄 App will continue running. Database operations will fail until connection is restored.');
    
    // Set up retry logic
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect to MongoDB...');
      connectDB();
    }, 10000); // Retry every 10 seconds
  }
};

module.exports = connectDB;
