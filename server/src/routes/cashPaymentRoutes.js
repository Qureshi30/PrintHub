const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/authMiddleware');
const CashPrintRequest = require('../models/CashPrintRequest');
const PrintJob = require('../models/PrintJob');
const Printer = require('../models/Printer');

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
 * @route   POST /api/cash-payment/upload
 * @desc    Create a new cash payment request (pending admin approval)
 * @access  Private (Student)
 */
router.post('/upload',
    requireAuth,
    [
        body('printerId').notEmpty().withMessage('Printer ID is required'),
        body('file').isObject().withMessage('File information is required'),
        body('file.cloudinaryUrl').isURL().withMessage('Valid Cloudinary URL is required'),
        body('file.publicId').notEmpty().withMessage('Cloudinary Public ID is required'),
        body('file.originalName').notEmpty().withMessage('Original file name is required'),
        body('file.format').notEmpty().withMessage('File format is required'),
        body('file.sizeKB').isNumeric().withMessage('File size must be a number'),
        body('settings').isObject().withMessage('Print settings are required'),
        body('settings.pages').notEmpty().withMessage('Pages setting is required'),
        body('cost.totalCost').isNumeric().withMessage('Total cost must be a number'),
        body('payment.amount').isNumeric().withMessage('Payment amount must be a number')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { printerId, file, settings, cost, payment } = req.body;
            const userId = req.user.id;

            console.log('💵 Cash payment request received from:', req.user.fullName);

            // Verify printer exists and is active
            const printer = await Printer.findById(printerId);
            if (!printer) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Printer not found',
                        code: 'PRINTER_NOT_FOUND'
                    }
                });
            }

            if (!printer.isActive) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Printer is not active',
                        code: 'PRINTER_INACTIVE'
                    }
                });
            }

            // Create cash print request
            const cashRequest = new CashPrintRequest({
                clerkUserId: userId,
                userName: req.user.fullName || 'Unknown User',
                userEmail: req.user.email || 'unknown@email.com',
                printerId,
                file: {
                    cloudinaryUrl: file.cloudinaryUrl,
                    publicId: file.publicId,
                    originalName: file.originalName,
                    format: file.format,
                    sizeKB: file.sizeKB
                },
                settings: {
                    pages: settings.pages || 'all',
                    copies: settings.copies || 1,
                    color: settings.color || false,
                    duplex: settings.duplex || false,
                    paperType: settings.paperType || 'A4'
                },
                cost: {
                    totalCost: cost.totalCost
                },
                payment: {
                    amount: payment.amount,
                    status: 'pending',
                    method: 'cash'
                },
                status: 'pending'
            });

            await cashRequest.save();

            console.log(`✅ Cash payment request created: ${cashRequest._id} for user: ${req.user.fullName}`);
            console.log(`📄 File: ${file.originalName}, Amount: ₹${payment.amount}`);

            res.status(201).json({
                success: true,
                data: {
                    requestId: cashRequest._id,
                    status: cashRequest.status,
                    message: 'Cash payment request submitted successfully. Please pay at the counter and wait for admin approval.'
                }
            });

        } catch (error) {
            console.error('❌ Cash payment upload error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to create cash payment request',
                    code: 'CREATE_REQUEST_ERROR'
                }
            });
        }
    }
);

/**
 * @route   GET /api/cash-payment/my-requests
 * @desc    Get all cash payment requests for the logged-in user
 * @access  Private (Student)
 */
router.get('/my-requests', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await CashPrintRequest.find({ clerkUserId: userId })
            .populate('printerId', 'name location')
            .sort({ 'timing.submittedAt': -1 });

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('❌ Error fetching user cash requests:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch cash payment requests',
                code: 'FETCH_REQUESTS_ERROR'
            }
        });
    }
});

/**
 * @route   GET /api/admin/cash-requests
 * @desc    Get all pending cash payment requests (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/cash-requests',
    requireAuth,
    async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied. Admin only.',
                        code: 'ADMIN_ONLY'
                    }
                });
            }

            const { status } = req.query;
            const filter = status ? { status } : {};

            const requests = await CashPrintRequest.find(filter)
                .populate('printerId', 'name location status')
                .sort({ 'timing.submittedAt': -1 });

            console.log(`📊 Admin fetched ${requests.length} cash payment requests`);

            res.json({
                success: true,
                data: requests,
                count: requests.length
            });

        } catch (error) {
            console.error('❌ Error fetching cash requests:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to fetch cash payment requests',
                    code: 'FETCH_REQUESTS_ERROR'
                }
            });
        }
    }
);

/**
 * @route   PATCH /api/admin/cash-requests/:id/complete
 * @desc    Mark cash payment as completed and move to printjobs collection
 * @access  Private (Admin)
 */
router.patch('/admin/cash-requests/:id/complete',
    [
        body('adminNotes').optional().isString(),
        requireAuth
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { adminNotes } = req.body;

            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied. Admin only.',
                        code: 'ADMIN_ONLY'
                    }
                });
            }

            // Find the cash payment request
            const cashRequest = await CashPrintRequest.findById(id);

            if (!cashRequest) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Cash payment request not found',
                        code: 'REQUEST_NOT_FOUND'
                    }
                });
            }

            if (cashRequest.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: `Request already ${cashRequest.status}`,
                        code: 'ALREADY_PROCESSED'
                    }
                });
            }

            // Verify printer is still available
            const printer = await Printer.findById(cashRequest.printerId);
            if (!printer || !printer.isActive) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Printer is not available',
                        code: 'PRINTER_UNAVAILABLE'
                    }
                });
            }

            console.log(`💰 Admin ${req.user.fullName} completing cash payment for request: ${id}`);

            // Create print job from cash request
            const printJob = new PrintJob({
                clerkUserId: cashRequest.clerkUserId,
                printerId: cashRequest.printerId,
                file: {
                    cloudinaryUrl: cashRequest.file.cloudinaryUrl,
                    publicId: cashRequest.file.publicId,
                    originalName: cashRequest.file.originalName,
                    format: cashRequest.file.format,
                    sizeKB: cashRequest.file.sizeKB
                },
                settings: {
                    pages: cashRequest.settings.pages,
                    copies: cashRequest.settings.copies,
                    color: cashRequest.settings.color,
                    duplex: cashRequest.settings.duplex,
                    paperType: cashRequest.settings.paperType,
                    status: 'queued' // Ready for printing
                },
                cost: {
                    totalCost: cashRequest.cost.totalCost
                },
                payment: {
                    amount: cashRequest.payment.amount,
                    status: 'paid', // Mark as paid
                    method: 'cash'
                },
                timing: {
                    submittedAt: cashRequest.timing.submittedAt,
                    updatedAt: new Date()
                }
            });

            // Save print job
            await printJob.save();

            // Add to printer queue
            await Printer.findByIdAndUpdate(
                cashRequest.printerId,
                { $push: { queue: printJob._id } },
                { new: true }
            );

            // Update cash request status
            cashRequest.status = 'approved';
            cashRequest.payment.status = 'completed';
            cashRequest.timing.completedAt = new Date();
            cashRequest.approvedBy = req.user.id;
            if (adminNotes) {
                cashRequest.adminNotes = adminNotes;
            }
            await cashRequest.save();

            console.log(`✅ Cash payment completed and print job created: ${printJob._id}`);
            console.log(`📄 File: ${printJob.file.originalName}, User: ${cashRequest.userName}`);
            console.log(`🖨️ Added to printer queue: ${printer.name}`);

            res.json({
                success: true,
                data: {
                    printJob: printJob._id,
                    message: 'Cash payment completed successfully. Print job added to queue.'
                }
            });

        } catch (error) {
            console.error('❌ Error completing cash payment:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to complete cash payment',
                    code: 'COMPLETE_PAYMENT_ERROR'
                }
            });
        }
    }
);

/**
 * @route   PATCH /api/admin/cash-requests/:id/reject
 * @desc    Reject a cash payment request
 * @access  Private (Admin)
 */
router.patch('/admin/cash-requests/:id/reject',
    [
        body('reason').optional().isString(),
        requireAuth
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied. Admin only.',
                        code: 'ADMIN_ONLY'
                    }
                });
            }

            const cashRequest = await CashPrintRequest.findById(id);

            if (!cashRequest) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Cash payment request not found',
                        code: 'REQUEST_NOT_FOUND'
                    }
                });
            }

            if (cashRequest.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: `Request already ${cashRequest.status}`,
                        code: 'ALREADY_PROCESSED'
                    }
                });
            }

            cashRequest.status = 'rejected';
            cashRequest.adminNotes = reason || 'Rejected by admin';
            cashRequest.approvedBy = req.user.id;
            await cashRequest.save();

            console.log(`❌ Cash payment request ${id} rejected by admin: ${req.user.fullName}`);

            res.json({
                success: true,
                data: {
                    message: 'Cash payment request rejected'
                }
            });

        } catch (error) {
            console.error('❌ Error rejecting cash payment:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to reject cash payment request',
                    code: 'REJECT_PAYMENT_ERROR'
                }
            });
        }
    }
);

/**
 * @route   DELETE /api/admin/cash-requests/:id
 * @desc    Delete a cash payment request
 * @access  Private (Admin)
 */
router.delete('/admin/cash-requests/:id',
    requireAuth,
    async (req, res) => {
        try {
            const { id } = req.params;

            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Access denied. Admin only.',
                        code: 'ADMIN_ONLY'
                    }
                });
            }

            const cashRequest = await CashPrintRequest.findByIdAndDelete(id);

            if (!cashRequest) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Cash payment request not found',
                        code: 'REQUEST_NOT_FOUND'
                    }
                });
            }

            console.log(`🗑️ Cash payment request ${id} deleted by admin: ${req.user.fullName}`);

            res.json({
                success: true,
                data: {
                    message: 'Cash payment request deleted successfully'
                }
            });

        } catch (error) {
            console.error('❌ Error deleting cash payment request:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to delete cash payment request',
                    code: 'DELETE_REQUEST_ERROR'
                }
            });
        }
    }
);

module.exports = router;
