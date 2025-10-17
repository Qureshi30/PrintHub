// Test script for Cash Payment System
// Run this to verify the backend routes are working

const API_URL = 'http://localhost:3001';

async function testCashPaymentSystem() {
    console.log('🧪 Testing Cash Payment System...\n');

    // Test 1: Health check
    console.log('1️⃣ Testing API health...');
    try {
        const response = await fetch(`${API_URL}/api/health`);
        const data = await response.json();
        console.log('✅ API is healthy:', data);
    } catch (error) {
        console.error('❌ API health check failed:', error.message);
        return;
    }

    // Test 2: Test printer endpoint
    console.log('\n2️⃣ Testing printer endpoint...');
    try {
        const response = await fetch(`${API_URL}/api/printers/test`);
        const data = await response.json();
        console.log('✅ Printers available:', data.length);
    } catch (error) {
        console.error('❌ Printer test failed:', error.message);
    }

    console.log('\n✅ Basic tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend server: cd server && npm run dev');
    console.log('2. Start the frontend server: npm run dev');
    console.log('3. Login as student and test cash payment flow');
    console.log('4. Login as admin and test approval flow');
}

// Run tests
testCashPaymentSystem();
