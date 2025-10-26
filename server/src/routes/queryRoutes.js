const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const Notification = require('../models/Notification');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const emailService = require('../services/unifiedEmailService');

// @route   POST /api/queries
// @desc    Submit a new support ticket/query
// @access  Protected (Student)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { category, subject, message } = req.body;

        // Validate required fields
        if (!category || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide category, subject, and message'
            });
        }

        // Get user info from Clerk (attached by requireAuth middleware)
        const studentId = req.user.id;
        const firstName = req.user.firstName || '';
        const lastName = req.user.lastName || '';
        const studentName = `${firstName} ${lastName}`.trim() || 'Student';
        const studentEmail = req.user.email || '';

        // Create new query
        const newQuery = new Query({
            studentId,
            studentName,
            studentEmail,
            category,
            subject,
            message,
            status: 'open',
            priority: 'medium'
        });

        await newQuery.save();

        // Create notification for student
        try {
            await Notification.create({
                clerkUserId: studentId,
                type: 'system',
                title: 'Support Ticket Submitted',
                message: `Your support ticket "${subject}" has been submitted successfully. Our team will respond shortly.`,
                priority: 'medium',
                metadata: {
                    category: category,
                    queryId: newQuery._id.toString()
                }
            });
            console.log(`🔔 Notification created for user ${studentId}`);
        } catch (notifError) {
            console.error('❌ Failed to create notification:', notifError);
        }

        // Send confirmation email to student
        try {
            await emailService.sendQueryResponseNotification(newQuery);
            console.log(`📧 Confirmation email sent to ${studentEmail} for new query ${newQuery._id}`);
        } catch (emailError) {
            console.error('❌ Failed to send confirmation email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Your ticket has been submitted successfully. Our support team will respond shortly.',
            data: newQuery
        });

    } catch (error) {
        console.error('Error submitting query:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit ticket. Please try again.',
            error: error.message
        });
    }
});

// @route   GET /api/queries/:id
// @desc    Get a specific ticket by ID (student can only view their own)
// @access  Protected (Student)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const queryId = req.params.id;
        const studentId = req.user.id;

        const query = await Query.findById(queryId).lean();

        if (!query) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Ensure student can only view their own tickets
        if (query.studentId !== studentId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this ticket'
            });
        }

        res.json({
            success: true,
            data: query
        });

    } catch (error) {
        console.error('Error fetching query:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ticket details',
            error: error.message
        });
    }
});

// @route   GET /api/queries/my-tickets
// @desc    Get all tickets submitted by the logged-in student
// @access  Protected (Student)
router.get('/my-tickets', requireAuth, async (req, res) => {
    try {
        const studentId = req.user.id;

        const queries = await Query.find({ studentId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: queries.length,
            data: queries
        });

    } catch (error) {
        console.error('Error fetching student queries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your tickets',
            error: error.message
        });
    }
});

// @route   GET /api/queries/admin/all
// @desc    Get all support tickets (for admin panel)
// @access  Protected (Admin only)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, priority, search, limit = 100, page = 1 } = req.query;

        // Build query filter
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search) {
            filter.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { studentEmail: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const queries = await Query.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        const totalCount = await Query.countDocuments(filter);

        res.json({
            success: true,
            count: queries.length,
            totalCount,
            page: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            data: queries
        });

    } catch (error) {
        console.error('Error fetching all queries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch queries',
            error: error.message
        });
    }
});

// @route   GET /api/queries/admin/:id
// @desc    Get a specific query by ID
// @access  Protected (Admin only)
router.get('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const query = await Query.findById(req.params.id);

        if (!query) {
            return res.status(404).json({
                success: false,
                message: 'Query not found'
            });
        }

        res.json({
            success: true,
            data: query
        });

    } catch (error) {
        console.error('Error fetching query:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch query',
            error: error.message
        });
    }
});

// @route   PUT /api/queries/admin/:id
// @desc    Update query status/response (admin only)
// @access  Protected (Admin only)
router.put('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, priority, adminResponse } = req.body;

        const query = await Query.findById(req.params.id);

        if (!query) {
            return res.status(404).json({
                success: false,
                message: 'Query not found'
            });
        }

        // Track if significant changes were made that warrant an email
        const shouldSendEmail =
            (status && status !== query.status) ||
            (adminResponse && adminResponse !== query.adminResponse) ||
            (status === 'resolved' || status === 'closed');

        // Update fields
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (adminResponse !== undefined) {
            query.adminResponse = adminResponse;
            query.respondedBy = req.user.id;
            query.respondedAt = new Date();
        }

        await query.save();

        // Create notification for student if significant update
        if (shouldSendEmail) {
            try {
                const statusMessages = {
                    'resolved': '✅ Your support ticket has been resolved!',
                    'closed': 'Your support ticket has been closed.',
                    'in-progress': '🔄 Your support ticket is being worked on.',
                    'open': 'Your support ticket has been updated.'
                };

                const notificationTitle = status ? statusMessages[status] || 'Support Ticket Updated' : 'Support Ticket Updated';
                const notificationMessage = adminResponse
                    ? `Admin response on "${query.subject}": ${adminResponse.substring(0, 100)}${adminResponse.length > 100 ? '...' : ''}`
                    : `Your support ticket "${query.subject}" status has been updated to ${status || query.status}.`;

                await Notification.create({
                    clerkUserId: query.studentId,
                    type: 'system',
                    title: notificationTitle,
                    message: notificationMessage,
                    priority: status === 'resolved' ? 'high' : 'medium',
                    metadata: {
                        category: query.category,
                        queryId: query._id.toString(),
                        newStatus: status || query.status
                    }
                });
                console.log(`🔔 Notification created for user ${query.studentId} about query ${query._id}`);
            } catch (notifError) {
                console.error('❌ Failed to create notification:', notifError);
            }
        }

        // Send email notification to student if significant update
        if (shouldSendEmail) {
            try {
                await emailService.sendQueryResponseNotification(query);
                console.log(`📧 Email notification sent to ${query.studentEmail} for query ${query._id}`);
            } catch (emailError) {
                console.error('❌ Failed to send email notification:', emailError);
                // Don't fail the request if email fails
            }
        }

        res.json({
            success: true,
            message: 'Query updated successfully' + (shouldSendEmail ? ' and notifications sent' : ''),
            data: query
        });

    } catch (error) {
        console.error('Error updating query:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update query',
            error: error.message
        });
    }
});

// @route   DELETE /api/queries/admin/:id
// @desc    Delete a query (admin only)
// @access  Protected (Admin only)
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const query = await Query.findById(req.params.id);

        if (!query) {
            return res.status(404).json({
                success: false,
                message: 'Query not found'
            });
        }

        await query.deleteOne();

        res.json({
            success: true,
            message: 'Query deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting query:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete query',
            error: error.message
        });
    }
});

// @route   GET /api/queries/admin/stats
// @desc    Get query statistics for admin dashboard
// @access  Protected (Admin only)
router.get('/admin/stats/overview', requireAuth, requireAdmin, async (req, res) => {
    try {
        const totalQueries = await Query.countDocuments();
        const openQueries = await Query.countDocuments({ status: 'open' });
        const inProgressQueries = await Query.countDocuments({ status: 'in-progress' });
        const resolvedQueries = await Query.countDocuments({ status: 'resolved' });
        const closedQueries = await Query.countDocuments({ status: 'closed' });

        const urgentQueries = await Query.countDocuments({
            priority: 'urgent',
            status: { $in: ['open', 'in-progress'] }
        });

        res.json({
            success: true,
            data: {
                total: totalQueries,
                open: openQueries,
                inProgress: inProgressQueries,
                resolved: resolvedQueries,
                closed: closedQueries,
                urgent: urgentQueries
            }
        });

    } catch (error) {
        console.error('Error fetching query stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

module.exports = router;
