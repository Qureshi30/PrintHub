const Razorpay = require('razorpay');
require('dotenv').config();

console.log('🔍 Testing Razorpay Payment Gateway Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.log('\n❌ Razorpay credentials missing! Please check your .env file.');
    process.exit(1);
}

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testRazorpayConnection() {
    try {
        console.log('\n🧪 Testing Razorpay API Connection...');

        // Test 1: Create a test order
        const orderOptions = {
            amount: 10000, // ₹100.00 in paise
            currency: 'INR',
            receipt: `test_${Date.now()}`,
            notes: {
                test: 'payment_gateway_test'
            }
        };

        console.log('Creating test order...');
        const order = await razorpay.orders.create(orderOptions);

        console.log('✅ Order created successfully!');
        console.log('Order ID:', order.id);
        console.log('Amount:', order.amount / 100, 'INR');
        console.log('Status:', order.status);

        // Test 2: Fetch the created order
        console.log('\n🔍 Fetching order details...');
        const fetchedOrder = await razorpay.orders.fetch(order.id);

        console.log('✅ Order fetched successfully!');
        console.log('Fetched Order ID:', fetchedOrder.id);
        console.log('Fetched Amount:', fetchedOrder.amount / 100, 'INR');

        // Test 3: List recent orders (optional)
        console.log('\n📋 Listing recent orders...');
        const orders = await razorpay.orders.all({ count: 5 });

        console.log(`✅ Found ${orders.items.length} recent orders`);

        console.log('\n🎉 All Razorpay tests passed successfully!');
        console.log('💳 Payment gateway is properly configured and working.');

        return {
            success: true,
            testOrderId: order.id,
            message: 'Razorpay integration is working properly'
        };

    } catch (error) {
        console.error('\n❌ Razorpay test failed:');
        console.error('Error Code:', error.code || 'UNKNOWN');
        console.error('Error Message:', error.description || error.message);

        if (error.code === 'BAD_REQUEST_ERROR') {
            console.error('\n💡 This might be due to:');
            console.error('   - Invalid API credentials');
            console.error('   - Account not activated');
            console.error('   - Insufficient permissions');
        }

        return {
            success: false,
            error: error.description || error.message
        };
    }
}

// Configuration check
async function checkConfiguration() {
    console.log('\n⚙️  Configuration Summary:');
    console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
    console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET.replace(/./g, '*'));
    console.log('Environment: Test Mode (using test keys)');

    // Validate key format
    if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
        console.log('⚠️  Warning: Key ID should start with "rzp_test_" for test environment');
    }

    return true;
}

// Run tests
(async () => {
    try {
        await checkConfiguration();
        const result = await testRazorpayConnection();

        if (result.success) {
            console.log('\n✅ PAYMENT GATEWAY STATUS: OPERATIONAL');
        } else {
            console.log('\n❌ PAYMENT GATEWAY STATUS: ERROR');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
        process.exit(1);
    }
})();