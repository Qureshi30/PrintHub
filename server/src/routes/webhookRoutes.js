const express = require('express');
const { Webhook } = require('svix');
const User = require('../models/User');

const router = express.Router();

// Webhook endpoint for Clerk user events
router.post('/clerk/users', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        // Get the headers
        const headers = req.headers;
        const payload = req.body;

        // Get the webhook secret from environment
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('❌ CLERK_WEBHOOK_SECRET not found in environment');
            return res.status(500).json({
                success: false,
                error: 'Webhook secret not configured'
            });
        }

        // Create a Webhook instance
        const wh = new Webhook(webhookSecret);

        let evt;

        // Verify the webhook signature
        try {
            evt = wh.verify(payload, headers);
        } catch (err) {
            console.error('❌ Webhook signature verification failed:', err.message);
            return res.status(400).json({
                success: false,
                error: 'Invalid webhook signature'
            });
        }

        console.log('🎯 Webhook received:', evt.type, evt.data?.id);

        // Handle user.created event
        if (evt.type === 'user.created') {
            const clerkUser = evt.data;

            console.log('👤 Processing new user signup:', {
                id: clerkUser.id,
                email: clerkUser.email_addresses?.[0]?.email_address,
                firstName: clerkUser.first_name,
                lastName: clerkUser.last_name
            });

            try {
                // Check if user already exists in our database
                const existingUser = await User.findOne({ clerkUserId: clerkUser.id });

                if (existingUser) {
                    console.log('ℹ️ User already exists in database, updating last active time');
                    
                    // Update last active time and ensure profile is up to date
                    await User.findOneAndUpdate(
                        { clerkUserId: clerkUser.id },
                        {
                            $set: {
                                'profile.firstName': clerkUser.first_name || existingUser.profile.firstName,
                                'profile.lastName': clerkUser.last_name || existingUser.profile.lastName,
                                'profile.email': clerkUser.email_addresses?.[0]?.email_address || existingUser.profile.email,
                                'profile.avatarUrl': clerkUser.image_url || existingUser.profile.avatarUrl,
                                lastActiveAt: new Date()
                            }
                        },
                        { new: true }
                    );
                    
                    return res.status(200).json({
                        success: true,
                        message: 'User already exists and profile updated',
                        userId: existingUser._id
                    });
                }

                // Create new user record in our database
                const newUser = new User({
                    clerkUserId: clerkUser.id,
                    role: 'student', // Default role for new signups
                    profile: {
                        firstName: clerkUser.first_name || '',
                        lastName: clerkUser.last_name || '',
                        email: clerkUser.email_addresses?.[0]?.email_address || '',
                        phone: clerkUser.phone_numbers?.[0]?.phone_number || '',
                        avatarUrl: clerkUser.image_url || ''
                    },
                    status: 'active',
                    preferences: {
                        emailNotifications: true,
                        smsNotifications: false,
                        theme: 'light',
                        language: 'en'
                    },
                    statistics: {
                        totalPrintJobs: 0,
                        totalPagesPrinted: 0,
                        totalAmountSpent: 0,
                        averageJobSize: 0,
                        lastPrintJob: null
                    },
                    createdAt: new Date(),
                    lastActiveAt: new Date()
                });

                const savedUser = await newUser.save();

                console.log('✅ User created in database:', {
                    mongoId: savedUser._id,
                    clerkId: savedUser.clerkUserId,
                    email: savedUser.profile.email,
                    role: savedUser.role
                });

                return res.status(201).json({
                    success: true,
                    message: 'User created successfully',
                    user: {
                        id: savedUser._id,
                        clerkUserId: savedUser.clerkUserId,
                        email: savedUser.profile.email,
                        role: savedUser.role
                    }
                });

            } catch (dbError) {
                console.error('❌ Failed to create user in database:', dbError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create user in database',
                    details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
                });
            }
        }

        // Handle user.updated event (optional - for profile updates)
        else if (evt.type === 'user.updated') {
            const clerkUser = evt.data;

            console.log('👤 Processing user update:', {
                id: clerkUser.id,
                email: clerkUser.email_addresses?.[0]?.email_address
            });

            try {
                const updatedUser = await User.findOneAndUpdate(
                    { clerkUserId: clerkUser.id },
                    {
                        $set: {
                            'profile.firstName': clerkUser.first_name || '',
                            'profile.lastName': clerkUser.last_name || '',
                            'profile.email': clerkUser.email_addresses?.[0]?.email_address || '',
                            'profile.phone': clerkUser.phone_numbers?.[0]?.phone_number || '',
                            'profile.avatarUrl': clerkUser.image_url || '',
                            updatedAt: new Date(),
                            lastActiveAt: new Date()
                        }
                    },
                    { new: true, runValidators: true }
                );

                if (updatedUser) {
                    console.log('✅ User updated in database:', updatedUser.clerkUserId);
                    return res.status(200).json({
                        success: true,
                        message: 'User updated successfully',
                        user: {
                            id: updatedUser._id,
                            clerkUserId: updatedUser.clerkUserId,
                            email: updatedUser.profile.email
                        }
                    });
                } else {
                    console.log('⚠️ User not found for update, creating new record');
                    // If user doesn't exist, treat as new user creation
                    // This can happen if webhook events are processed out of order
                    return res.status(404).json({
                        success: false,
                        message: 'User not found for update'
                    });
                }

            } catch (dbError) {
                console.error('❌ Failed to update user in database:', dbError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update user in database',
                    details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
                });
            }
        }

        // Handle user.deleted event (optional - for cleanup)
        else if (evt.type === 'user.deleted') {
            const clerkUser = evt.data;

            console.log('👤 Processing user deletion:', clerkUser.id);

            try {
                const deletedUser = await User.findOneAndUpdate(
                    { clerkUserId: clerkUser.id },
                    {
                        $set: {
                            status: 'deleted',
                            deletedAt: new Date()
                        }
                    },
                    { new: true }
                );

                if (deletedUser) {
                    console.log('✅ User marked as deleted in database:', deletedUser.clerkUserId);
                    return res.status(200).json({
                        success: true,
                        message: 'User marked as deleted successfully'
                    });
                } else {
                    console.log('⚠️ User not found for deletion');
                    return res.status(404).json({
                        success: false,
                        message: 'User not found for deletion'
                    });
                }

            } catch (dbError) {
                console.error('❌ Failed to mark user as deleted:', dbError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to mark user as deleted',
                    details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
                });
            }
        }

        // For any other event types, just acknowledge receipt
        else {
            console.log(`ℹ️ Received unhandled webhook event: ${evt.type}`);
            return res.status(200).json({
                success: true,
                message: `Event ${evt.type} received but not processed`
            });
        }

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal webhook processing error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint for webhook
router.get('/clerk/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Clerk webhook endpoint is healthy',
        timestamp: new Date().toISOString()
    });
});

console.log('🔗 Webhook routes loaded');

module.exports = router;