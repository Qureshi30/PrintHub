/**
 * Admin Role Assignment Script
 * 
 * This script assigns admin role to a specific user by updating their Clerk publicMetadata.
 * 
 * Usage:
 *   node assign-admin-role.js
 */

const { clerkClient } = require('@clerk/clerk-sdk-node');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

async function main() {
  try {
    console.log('👑 Admin Role Assignment Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub');
    console.log('✅ Connected to MongoDB');
    console.log('');

    // The user ID from your error logs
    const targetUserId = 'user_3363ym7naD57j72evR45xpUevHZ';
    
    console.log(`🔍 Looking up user: ${targetUserId}`);

    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(targetUserId);
    
    if (!clerkUser) {
      console.log('❌ User not found in Clerk');
      process.exit(1);
    }

    console.log(`📋 Current user details:`);
    console.log(`   Name: ${clerkUser.firstName} ${clerkUser.lastName}`);
    console.log(`   Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
    console.log(`   Current Role: ${clerkUser.publicMetadata?.role || 'None'}`);
    console.log('');

    // Check if user is already admin
    if (clerkUser.publicMetadata?.role === 'admin') {
      console.log('✅ User is already an admin!');
      process.exit(0);
    }

    console.log('🚀 Updating user role to admin...');

    // Update user role in Clerk
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        role: 'admin'
      }
    });

    console.log('✅ Updated Clerk publicMetadata');

    // Check if user exists in our database
    let dbUser = await User.findOne({ clerkUserId: targetUserId });
    
    if (dbUser) {
      // Update existing user
      dbUser.role = 'admin';
      await dbUser.save();
      console.log('✅ Updated user role in database');
    } else {
      // Create new user record
      dbUser = new User({
        clerkUserId: targetUserId,
        role: 'admin',
        profile: {
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          email: clerkUser.emailAddresses[0]?.emailAddress,
        },
        preferences: {
          notifications: {
            email: true,
            push: true,
            printComplete: true,
            queueUpdates: true
          },
          defaultSettings: {
            color: false,
            duplex: false,
            copies: 1,
            paperType: 'A4'
          }
        }
      });
      await dbUser.save();
      console.log('✅ Created new admin user in database');
    }

    console.log('');
    console.log('🎉 Admin role assignment completed successfully!');
    console.log('');
    console.log('📋 Updated user details:');
    console.log(`   User ID: ${targetUserId}`);
    console.log(`   Name: ${clerkUser.firstName} ${clerkUser.lastName}`);
    console.log(`   Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
    console.log(`   Role: admin`);
    console.log('');
    console.log('🔄 Please refresh your browser and try signing in again.');
    console.log('   You should now have access to the admin dashboard at /admin');
    console.log('');

  } catch (error) {
    console.error('❌ Error during role assignment:', error.message);
    
    if (error.status === 401) {
      console.log('');
      console.log('🔑 Authentication Error:');
      console.log('   Make sure your CLERK_SECRET_KEY is set in .env file');
      console.log('   Get it from: https://dashboard.clerk.com/');
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
  }
}

// Handle process interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Process interrupted. Cleaning up...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});