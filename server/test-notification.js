/**
 * Manual Printer Error Test
 * Run this to manually trigger a test notification to admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');

async function createTestNotification() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub');
    console.log('✅ Connected');
    
    // Create test admin notification
    const notification = await Notification.create({
      clerkUserId: 'system_admin',
      type: 'maintenance',
      title: '⚠️ TEST: Printer Low Paper Alert',
      message: 'HP LaserJet Pro M201-M202 has low paper (only 1 sheet remaining)',
      priority: 'high',
      metadata: {
        errorCode: 'lowPaper',
        actionRequired: true,
      },
    });
    
    console.log('✅ Test notification created:');
    console.log(JSON.stringify(notification, null, 2));
    
    // Check if notification appears in database
    const allNotifications = await Notification.find({ type: 'maintenance' })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('\n📋 Recent maintenance notifications:');
    allNotifications.forEach(n => {
      console.log(`  - ${n.title} (${n.createdAt})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestNotification();
