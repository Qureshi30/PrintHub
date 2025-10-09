const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const razorpay = require('../config/razorpay');
const PrintJob = require('../models/PrintJob');
const crypto = require('crypto');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array()
            }
        });
    }
    next();
};

/**
 * @route   POST /payments/create-temp-order
 * @desc    Create a temporary Razorpay order before print job creation
 * @access  Private
 */
router.post('/create-temp-order',
    [
        body('amount').isNumeric().withMessage('Amount must be a number'),
        body('currency').optional().isString().withMessage('Currency must be a string'),
        body('notes').optional().isObject().withMessage('Notes must be an object'),
        requireAuth
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { amount, currency = 'INR', notes = {} } = req.body;
            const userId = req.user.id;

            // Create Razorpay order
            // Generate short receipt (max 40 chars for Razorpay)
            const timestamp = Date.now().toString().slice(-8); // Last 8 digits
            const userIdShort = userId.slice(-8); // Last 8 chars of user ID
            const receipt = `temp_${userIdShort}_${timestamp}`;

            const orderOptions = {
                amount: Math.round(amount * 100), // Amount in paise
                currency: currency,
                receipt: receipt,
                notes: {
                    ...notes,
                    userId: userId,
                    type: 'temp_print_payment'
                }
            };

            const order = await razorpay.orders.create(orderOptions);

            console.log(`💳 Temporary payment order created: ${order.id} for user: ${req.user.fullName}`);

            res.json({
                success: true,
                data: {
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    key: process.env.RAZORPAY_KEY_ID
                }
            });

        } catch (error) {
            console.error('❌ Create temp order error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to create payment order',
                    code: 'CREATE_ORDER_ERROR'
                }
            });
        }
    }
);

/**
 * @route   POST /payments/create-order
 * @desc    Create a Razorpay order for print job payment (legacy)
 * @access  Private
 */
router.post('/create-order',
    [
        body('printJobId').notEmpty().withMessage('Print job ID is required'),
        body('amount').isNumeric().withMessage('Amount must be a number'),
        requireAuth
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { printJobId, amount } = req.body;
            const userId = req.user.id;

            // Verify the print job belongs to the user
            const printJob = await PrintJob.findOne({
                _id: printJobId,
                clerkUserId: userId
            });

            if (!printJob) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Print job not found',
                        code: 'PRINT_JOB_NOT_FOUND'
                    }
                });
            }

            // Create Razorpay order
            // Generate short receipt (max 40 chars for Razorpay)
            const timestamp = Date.now().toString().slice(-8); // Last 8 digits
            const jobIdShort = printJobId.toString().slice(-8); // Last 8 chars
            const receipt = `print_${jobIdShort}_${timestamp}`;

            const orderOptions = {
                amount: Math.round(amount * 100), // Amount in paise
                currency: 'INR',
                receipt: receipt,
                notes: {
                    printJobId: printJobId.toString(),
                    userId: userId,
                    type: 'print_payment'
                }
            };

            const order = await razorpay.orders.create(orderOptions);

            // Update print job with payment details
            printJob.payment = {
                ...printJob.payment,
                razorpayOrderId: order.id,
                amount: amount,
                status: 'pending'
            };
            await printJob.save();

            console.log(`💳 Payment order created: ${order.id} for user: ${req.user.fullName}`);

            res.json({
                success: true,
                data: {
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                    printJobId: printJobId
                }
            });

        } catch (error) {
            console.error('❌ Create order error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to create payment order',
                    code: 'CREATE_ORDER_ERROR'
                }
            });
        }
    }
);

/**
 * @route   POST /payments/verify-temp-payment
 * @desc    Verify Razorpay payment signature for temporary orders
 * @access  Private
 */
router.post('/verify-temp-payment',
    [
        body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
        body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
        body('razorpay_signature').notEmpty().withMessage('Signature is required'),
        requireAuth
    ],
    validateRequest,
    async (req, res) => {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;

            // Verify signature
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid payment signature',
                        code: 'INVALID_SIGNATURE'
                    }
                });
            }

            console.log(`✅ Temporary payment verified successfully: ${razorpay_payment_id}`);

            res.json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    verified: true,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Temporary payment verification error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Payment verification failed',
                    code: 'VERIFICATION_ERROR'
                }
            });
        }
    }
);

/**
 * @route   POST /payments/verify-payment
 * @desc    Verify Razorpay payment signature and update print job (legacy)
 * @access  Private
 */
router.post('/verify-payment',
    [
        body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
        body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
        body('razorpay_signature').notEmpty().withMessage('Signature is required'),
        body('printJobId').notEmpty().withMessage('Print job ID is required'),
        requireAuth
    ],
    validateRequest,
    async (req, res) => {
        try {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                printJobId
            } = req.body;

            // Verify signature
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid payment signature',
                        code: 'INVALID_SIGNATURE'
                    }
                });
            }

            // Update print job payment status
            const printJob = await PrintJob.findOneAndUpdate(
                {
                    _id: printJobId,
                    clerkUserId: req.user.id,
                    'payment.razorpayOrderId': razorpay_order_id
                },
                {
                    $set: {
                        'payment.status': 'completed',
                        'payment.razorpayPaymentId': razorpay_payment_id,
                        'payment.razorpaySignature': razorpay_signature,
                        'payment.paidAt': new Date(),
                        'status': 'payment_verified'
                    }
                },
                { new: true }
            );

            if (!printJob) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Print job not found or payment mismatch',
                        code: 'PRINT_JOB_NOT_FOUND'
                    }
                });
            }

            console.log(`✅ Payment verified successfully: ${razorpay_payment_id} for print job: ${printJobId}`);

            res.json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    printJobId: printJob._id,
                    paymentId: razorpay_payment_id,
                    status: printJob.status
                }
            });

        } catch (error) {
            console.error('❌ Payment verification error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Payment verification failed',
                    code: 'VERIFICATION_ERROR'
                }
            });
        }
    }
);

/**
 * @route   GET /payments/:printJobId/status
 * @desc    Get payment status for a print job
 * @access  Private
 */
router.get('/:printJobId/status', requireAuth, async (req, res) => {
    try {
        const { printJobId } = req.params;

        const printJob = await PrintJob.findOne({
            _id: printJobId,
            clerkUserId: req.user.id
        }).select('payment status');

        if (!printJob) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Print job not found',
                    code: 'PRINT_JOB_NOT_FOUND'
                }
            });
        }

        res.json({
            success: true,
            data: {
                printJobId: printJob._id,
                paymentStatus: printJob.payment?.status || 'pending',
                jobStatus: printJob.status,
                amount: printJob.payment?.amount || 0,
                paidAt: printJob.payment?.paidAt
            }
        });

    } catch (error) {
        console.error('❌ Get payment status error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get payment status',
                code: 'GET_STATUS_ERROR'
            }
        });
    }
});

module.exports = router;