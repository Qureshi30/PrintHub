const PrintJob = require('../models/PrintJob');
const Queue = require('../models/Queue');
const Revenue = require('../models/Revenue');
const AdminLog = require('../models/AdminLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const razorpay = require('../config/razorpay');

/**
 * Terminate a print job and initiate refund
 * @route DELETE /api/admin/printjobs/:id/terminate
 * @access Admin only
 */
const terminatePrintJob = async (req, res) => {
  const session = await PrintJob.startSession();
  
  try {
    await session.startTransaction();
    
    const { id: jobId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    const adminName = req.user.fullName || 'Admin';

    console.log(`🛑 Admin ${adminName} attempting to terminate job ${jobId}`);

    // 1. Fetch the print job
    const printJob = await PrintJob.findById(jobId).session(session);

    if (!printJob) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: {
          message: 'Print job not found',
          code: 'JOB_NOT_FOUND'
        }
      });
    }

    // 2. Check if job can be terminated
    const terminatableStatuses = ['pending', 'queued', 'in-progress', 'printing'];
    if (!terminatableStatuses.includes(printJob.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot terminate job with status: ${printJob.status}. Only pending, queued, in-progress, or printing jobs can be terminated.`,
          code: 'INVALID_STATUS',
          currentStatus: printJob.status
        }
      });
    }

    // 3. Store original values for logging
    const originalStatus = printJob.status;
    const originalQueuePosition = printJob.queuePosition;
    const refundAmount = printJob.cost.totalCost;
    const userId = printJob.clerkUserId;
    const fileName = printJob.file.originalName;

    // 4. Update print job status to terminated
    printJob.status = 'terminated';
    printJob.errorMessage = reason || 'Job terminated by admin';
    printJob.timing.completedAt = new Date();
    
    // 5. Handle refund if payment was made
    let refundResult = null;
    let refundStatus = 'none';
    
    if (printJob.payment.status === 'paid' && refundAmount > 0) {
      // Check if this is a Razorpay payment
      if (printJob.payment.razorpayPaymentId) {
        try {
          console.log(`💰 Initiating Razorpay refund for payment ${printJob.payment.razorpayPaymentId}`);
          
          // Initiate refund via Razorpay
          refundResult = await razorpay.payments.refund(
            printJob.payment.razorpayPaymentId,
            {
              amount: Math.round(refundAmount * 100), // Convert to paise
              speed: 'normal',
              notes: {
                reason: reason || 'Job terminated by admin',
                jobId: jobId,
                adminId: adminId,
                originalFileName: fileName
              }
            }
          );

          console.log(`✅ Refund created: ${refundResult.id}`);

          // Update payment info with refund details
          printJob.payment.refundStatus = 'initiated';
          printJob.payment.refundId = refundResult.id;
          printJob.payment.refundAmount = refundAmount;
          printJob.payment.refundedAt = new Date();
          printJob.payment.status = 'refund_initiated';
          refundStatus = 'initiated';

        } catch (refundError) {
          console.error('❌ Refund failed:', refundError);
          
          // Rollback transaction if refund fails
          await session.abortTransaction();
          
          return res.status(500).json({
            success: false,
            error: {
              message: 'Failed to process refund. Job termination cancelled.',
              code: 'REFUND_FAILED',
              details: refundError.error?.description || refundError.message
            }
          });
        }
      } else {
        // For non-Razorpay payments (cash, student credit, etc.)
        console.log(`💰 Marking refund for non-Razorpay payment method: ${printJob.payment.method}`);
        printJob.payment.refundStatus = 'completed';
        printJob.payment.refundAmount = refundAmount;
        printJob.payment.refundedAt = new Date();
        printJob.payment.status = 'refunded';
        refundStatus = 'completed';
      }
    }

    await printJob.save({ session });

    // 6. Remove from queue and recalculate positions
    const queueEntry = await Queue.findOne({ printJobId: jobId }).session(session);
    
    if (queueEntry) {
      const removedPosition = queueEntry.position;
      
      // Remove the terminated job from queue
      await Queue.deleteOne({ printJobId: jobId }).session(session);
      
      // Recalculate queue positions for jobs that were after this one
      await Queue.updateMany(
        { 
          position: { $gt: removedPosition },
          status: { $in: ['pending', 'in-progress'] }
        },
        { $inc: { position: -1 } },
        { session }
      );
      
      console.log(`📋 Removed job from queue position ${removedPosition} and recalculated remaining positions`);
    }

    // 7. Remove from Revenue collection if it was recorded
    const revenueEntry = await Revenue.findOne({ printJobId: jobId }).session(session);
    if (revenueEntry) {
      await Revenue.deleteOne({ printJobId: jobId }).session(session);
      console.log(`💵 Removed revenue entry for terminated job`);
    }

    // 8. Log admin action
    await AdminLog.logAction({
      adminId: adminId,
      action: 'terminate_job',
      target: {
        type: 'print_job',
        id: jobId,
        name: fileName
      },
      jobId: jobId,
      printerId: printJob.printerId,
      userId: userId,
      details: {
        description: `Terminated print job "${fileName}" for user ${printJob.userEmail || userId}`,
        reason: reason || 'No reason provided',
        oldValue: {
          status: originalStatus,
          queuePosition: originalQueuePosition
        },
        newValue: {
          status: 'terminated',
          queuePosition: null
        },
        metadata: {
          refundAmount: refundAmount,
          refundStatus: refundStatus,
          refundId: refundResult?.id || null,
          paymentMethod: printJob.payment.method
        }
      },
      impact: 'high',
      status: 'completed',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // 9. Create notification for user
    const reasonText = reason ? `: ${reason}` : '';
    const refundText = refundAmount > 0 ? ` A refund of ₹${refundAmount.toFixed(2)} has been initiated.` : '';
    const notificationMessage = `Your print job "${fileName}" was cancelled by the admin${reasonText}.${refundText}`;
    
    await Notification.createNotification({
      clerkUserId: userId,
      jobId: jobId,
      type: 'job_terminated',
      title: '🛑 Print Job Terminated',
      message: notificationMessage,
      priority: 'high',
      metadata: {
        printerId: printJob.printerId,
        cost: refundAmount,
        actionRequired: false,
        refundAmount: refundAmount,
        refundStatus: refundStatus
      }
    });

    // 10. Commit transaction
    await session.commitTransaction();

    console.log(`✅ Job ${jobId} successfully terminated with refund status: ${refundStatus}`);

    // 11. Send success response
    res.json({
      success: true,
      message: 'Print job terminated successfully',
      data: {
        jobId: jobId,
        fileName: fileName,
        previousStatus: originalStatus,
        currentStatus: 'terminated',
        refund: {
          status: refundStatus,
          amount: refundAmount,
          refundId: refundResult?.id || null,
          method: printJob.payment.method
        },
        queueUpdated: !!queueEntry,
        notification: 'User has been notified'
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Terminate job error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to terminate print job',
        code: 'TERMINATION_ERROR',
        details: error.message
      }
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get all terminated jobs (for admin reference)
 * @route GET /api/admin/printjobs/terminated
 * @access Admin only
 */
const getTerminatedJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const terminatedJobs = await PrintJob.find({ status: 'terminated' })
      .populate('printerId', 'name location status')
      .sort({ 'timing.completedAt': -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .lean();

    // Fetch user data for each job
    const jobsWithUserData = await Promise.all(terminatedJobs.map(async (job) => {
      try {
        const user = await User.findOne({ clerkUserId: job.clerkUserId })
          .select('profile.firstName profile.lastName profile.email')
          .lean();
        
        if (user && user.profile) {
          job.userName = user.profile.firstName 
            ? `${user.profile.firstName}${user.profile.lastName ? ' ' + user.profile.lastName : ''}`
            : null;
          job.userEmail = user.profile.email || null;
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch user data for terminated job ${job._id}:`, err);
      }
      return job;
    }));

    const total = await PrintJob.countDocuments({ status: 'terminated' });

    res.json({
      success: true,
      data: {
        jobs: jobsWithUserData,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get terminated jobs error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch terminated jobs',
        code: 'FETCH_ERROR'
      }
    });
  }
};

module.exports = {
  terminatePrintJob,
  getTerminatedJobs
};
