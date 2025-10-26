/**
 * Clerk Configuration Diagnosis and Fix Script
 * 
 * This script checks and verifies Clerk configuration to resolve OAuth callback errors.
 * 
 * Usage:
 *   node clerk-diagnosis.js
 */

const { clerkClient } = require('@clerk/clerk-sdk-node');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

async function main() {
  try {
    console.log('🔍 Clerk Configuration Diagnosis');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // 1. Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log(`   ✅ CLERK_PUBLISHABLE_KEY: ${process.env.CLERK_PUBLISHABLE_KEY ? 'Set' : '❌ Missing'}`);
    console.log(`   ✅ CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? 'Set' : '❌ Missing'}`);
    console.log('');

    if (!process.env.CLERK_SECRET_KEY) {
      console.log('❌ CLERK_SECRET_KEY is missing from .env file');
      console.log('   Please add it to server/.env file');
      process.exit(1);
    }

    // 2. Test Clerk API connection
    console.log('🔌 Testing Clerk API Connection...');
    try {
      const users = await clerkClient.users.getUserList({ limit: 1 });
      console.log('   ✅ Successfully connected to Clerk API');
      console.log(`   📊 Total users in your Clerk instance: ${users.totalCount}`);
    } catch (error) {
      console.log('   ❌ Failed to connect to Clerk API');
      console.log(`   Error: ${error.message}`);
      
      if (error.status === 401) {
        console.log('   🔑 This is likely an invalid CLERK_SECRET_KEY');
        console.log('   Please check your Clerk dashboard for the correct secret key');
      }
      process.exit(1);
    }
    console.log('');

    // 3. Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/printhub');
    console.log('   ✅ Connected to MongoDB');
    console.log('');

    // 4. Check your specific user
    const targetUserId = 'user_3363ym7naD57j72evR45xpUevHZ';
    console.log(`🔍 Checking user: ${targetUserId}`);
    
    try {
      const clerkUser = await clerkClient.users.getUser(targetUserId);
      console.log('   ✅ User found in Clerk');
      console.log(`   📧 Email: ${clerkUser.emailAddresses[0]?.emailAddress}`);
      console.log(`   👤 Name: ${clerkUser.firstName} ${clerkUser.lastName}`);
      console.log(`   🔑 Current Role: ${clerkUser.publicMetadata?.role || 'None'}`);
      console.log(`   ⏰ Last Sign In: ${clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt).toLocaleString() : 'Never'}`);
      console.log(`   🔄 Updated At: ${new Date(clerkUser.updatedAt).toLocaleString()}`);
      
      // Check if role needs to be set
      if (clerkUser.publicMetadata?.role !== 'admin') {
        console.log('');
        console.log('🚀 Fixing admin role...');
        await clerkClient.users.updateUserMetadata(targetUserId, {
          publicMetadata: {
            ...clerkUser.publicMetadata,
            role: 'admin'
          }
        });
        console.log('   ✅ Admin role updated in Clerk');
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking user: ${error.message}`);
    }
    console.log('');

    // 5. Check database user
    console.log('💾 Checking database user record...');
    let dbUser = await User.findOne({ clerkUserId: targetUserId });
    
    if (dbUser) {
      console.log('   ✅ User found in database');
      console.log(`   🔑 DB Role: ${dbUser.role}`);
      
      if (dbUser.role !== 'admin') {
        dbUser.role = 'admin';
        await dbUser.save();
        console.log('   ✅ Database role updated to admin');
      }
    } else {
      console.log('   ⚠️ User not found in database, creating...');
      const clerkUser = await clerkClient.users.getUser(targetUserId);
      dbUser = new User({
        clerkUserId: targetUserId,
        role: 'admin',
        profile: {
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          email: clerkUser.emailAddresses[0]?.emailAddress,
        }
      });
      await dbUser.save();
      console.log('   ✅ Admin user created in database');
    }
    console.log('');

    // 6. Configuration recommendations
    console.log('⚙️ Clerk Dashboard Configuration Check:');
    console.log('   Please verify these settings in your Clerk dashboard:');
    console.log('');
    console.log('   🌐 Allowed Origins/Domains:');
    console.log('      • http://localhost:8080 (Vite dev server)');
    console.log('      • http://localhost:5173 (Alternative Vite port)');
    console.log('      • http://localhost:3000 (React dev server)');
    console.log('');
    console.log('   🔄 Redirect URLs:');
    console.log('      • http://localhost:8080/');
    console.log('      • http://localhost:8080/dashboard');
    console.log('      • http://localhost:8080/admin');
    console.log('');
    console.log('   📱 Sign-in/Sign-up Options:');
    console.log('      • Email + Password should be enabled');
    console.log('      • OAuth providers (Google, etc.) should be properly configured');
    console.log('');

    // 7. Generate new session token (if possible)
    console.log('🔄 Session Management:');
    console.log('   To fix OAuth callback issues:');
    console.log('   1. Clear all browser cookies and local storage');
    console.log('   2. Sign out completely from your application');
    console.log('   3. Close all browser tabs');
    console.log('   4. Open a new browser tab/window');
    console.log('   5. Try signing in again');
    console.log('');

    console.log('🎉 Diagnosis Complete!');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Clear your browser cache and cookies completely');
    console.log('   2. Restart your development servers (both frontend and backend)');
    console.log('   3. Visit http://localhost:8080 in a fresh browser tab');
    console.log('   4. Try signing in again');
    console.log('');
    console.log('   If issues persist:');
    console.log('   • Check Clerk dashboard for domain/redirect URL configuration');
    console.log('   • Verify OAuth provider settings');
    console.log('   • Try signing in with a different browser');
    console.log('');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
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