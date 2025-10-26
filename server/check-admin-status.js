const { clerkClient } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

async function checkAdminStatus() {
  try {
    console.log('🔍 Checking admin users...');
    
    // List all users
    const users = await clerkClient.users.getUserList();
    
    console.log('\n📋 All Users:');
    console.log('=' + '='.repeat(80));
    
    users.data.forEach(user => {
      const email = user.emailAddresses[0]?.emailAddress || 'No email';
      const role = user.publicMetadata?.role || 'No role set';
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name';
      
      console.log(`👤 ${name}`);
      console.log(`   📧 Email: ${email}`);
      console.log(`   🔑 Role: ${role}`);
      console.log(`   🆔 Clerk ID: ${user.id}`);
      console.log('   ' + '-'.repeat(60));
    });
    
    // Check for admin users specifically
    const adminUsers = users.data.filter(user => user.publicMetadata?.role === 'admin');
    
    console.log('\n👑 Admin Users:');
    console.log('=' + '='.repeat(50));
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
      console.log('\n💡 To create an admin user, use the assign-admin-role.js script:');
      console.log('   node assign-admin-role.js <email>');
    } else {
      adminUsers.forEach(admin => {
        const email = admin.emailAddresses[0]?.emailAddress;
        const name = `${admin.firstName || ''} ${admin.lastName || ''}`.trim();
        console.log(`✅ ${name} (${email})`);
      });
    }
    
    // Check specific user if provided as argument
    if (process.argv[2]) {
      const targetEmail = process.argv[2];
      console.log(`\n🔍 Checking specific user: ${targetEmail}`);
      console.log('=' + '='.repeat(50));
      
      const targetUser = users.data.find(u => 
        u.emailAddresses.some(e => e.emailAddress === targetEmail)
      );
      
      if (targetUser) {
        const role = targetUser.publicMetadata?.role || 'No role set';
        const name = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim();
        
        console.log(`👤 User Found: ${name}`);
        console.log(`📧 Email: ${targetEmail}`);
        console.log(`🔑 Current Role: ${role}`);
        console.log(`🆔 Clerk ID: ${targetUser.id}`);
        
        if (role === 'admin') {
          console.log('✅ User has admin privileges');
        } else {
          console.log('❌ User does NOT have admin privileges');
          console.log('\n💡 To grant admin access, run:');
          console.log(`   node assign-admin-role.js ${targetEmail}`);
        }
      } else {
        console.log(`❌ User not found: ${targetEmail}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n💡 Fix: Check your .env file and ensure CLERK_SECRET_KEY is set correctly');
    }
  }
}

console.log('🚀 Admin Status Checker');
console.log('Usage: node check-admin-status.js [email-to-check]');
console.log('');

checkAdminStatus();