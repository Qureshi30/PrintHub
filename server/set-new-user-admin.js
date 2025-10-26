/**
 * Find and Set Admin Role for New User
 * 
 * This script finds the most recent user and sets them as admin.
 * 
 * Usage:
 *   node set-new-user-admin.js
 */

const { clerkClient } = require('@clerk/clerk-sdk-node');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

async function main() {
  try {
    console.log('🔍 Finding and Setting Admin Role for New User');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub');
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Get all users from Clerk, sorted by creation date (newest first)
    console.log('🔍 Fetching users from Clerk...');
    const users = await clerkClient.users.getUserList({ 
      limit: 10,
      orderBy: '-created_at'
    });

    console.log(`📊 Found ${users.data.length} users in Clerk:`);
    console.log('');

    // Display all users with their details
    users.data.forEach((user, index) => {
      const email = user.emailAddresses[0]?.emailAddress;
      const role = user.publicMetadata?.role || 'None';
      const createdAt = new Date(user.createdAt).toLocaleString();
      
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${email}`);
      console.log(`   Role: ${role}`);
      console.log(`   Created: ${createdAt}`);
      console.log(`   Last Sign In: ${user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Never'}`);
      console.log('');
    });

    // Find the most recently created user or most recently signed in
    let targetUser = users.data.find(user => user.lastSignInAt) || users.data[0];
    
    if (!targetUser) {
      console.log('❌ No users found');
      process.exit(1);
    }

    console.log(`🎯 Setting admin role for: ${targetUser.firstName} ${targetUser.lastName} (${targetUser.emailAddresses[0]?.emailAddress})`);
    console.log(`   User ID: ${targetUser.id}`);
    console.log('');

    // Update user role in Clerk
    console.log('🚀 Updating user role to admin in Clerk...');
    await clerkClient.users.updateUserMetadata(targetUser.id, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        role: 'admin'
      }
    });
    console.log('✅ Updated Clerk publicMetadata');

    // Update or create user in database
    console.log('💾 Updating user in database...');
    let dbUser = await User.findOne({ clerkUserId: targetUser.id });
    
    if (dbUser) {
      dbUser.role = 'admin';
      await dbUser.save();
      console.log('✅ Updated existing user role in database');
    } else {
      dbUser = new User({
        clerkUserId: targetUser.id,
        role: 'admin',
        profile: {
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          email: targetUser.emailAddresses[0]?.emailAddress,
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
    console.log('🎉 Admin role assignment completed!');
    console.log('');
    console.log('📋 Updated user details:');
    console.log(`   User ID: ${targetUser.id}`);
    console.log(`   Name: ${targetUser.firstName} ${targetUser.lastName}`);
    console.log(`   Email: ${targetUser.emailAddresses[0]?.emailAddress}`);
    console.log(`   Role: admin`);
    console.log('');
    console.log('🔄 Please refresh your browser and try accessing /admin/pricing again');
    console.log('');

  } catch (error) {
    console.error('❌ Error during role assignment:', error.message);
    process.exit(1);
  } finally {
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