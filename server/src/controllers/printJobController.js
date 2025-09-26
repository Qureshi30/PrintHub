const PrintJob = require('../models/PrintJob');
const PrintedJob = require('../models/PrintedJob');
const { downloadFile, downloadFileByPublicId, deleteTempFile } = require('../utils/fileUtils');
const { printFile, getDefaultPrinter, getPrinterName } = require('../utils/printerUtils');
const emailService = require('../services/unifiedEmailService');
const printerService = require('../services/printerService');

/**
 * Create a new print job after payment confirmation
 */
const createPrintJob = async (req, res) => {
  try {
    const {
      clerkUserId,
      userName,
      userEmail,
      printerId,
      file,
      settings,
      payment,
      cost,
    } = req.body;

    console.log('📝 Creating new print job for user:', clerkUserId);

    // Validate required fields
    if (!clerkUserId || !printerId || !file || !payment?.transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clerkUserId, printerId, file, or payment.transactionId',
      });
    }

    // Create new print job
    const newPrintJob = new PrintJob({
      clerkUserId,
      userName,
      userEmail,
      printerId,
      file: {
        cloudinaryUrl: file.cloudinaryUrl,
        publicId: file.publicId,
        originalName: file.originalName,
        format: file.format,
        sizeKB: file.sizeKB,
      },
      settings: {
        pages: settings?.pages || 'all',
        copies: settings?.copies || 1,
        color: settings?.color || false,
        duplex: settings?.duplex || false,
        paperType: settings?.paperType || 'A4',
      },
      payment: {
        status: 'paid',
        method: payment.method || 'card',
        transactionId: payment.transactionId,
        paidAt: new Date(),
      },
      cost: {
        baseCost: cost?.baseCost || 0,
        colorCost: cost?.colorCost || 0,
        paperCost: cost?.paperCost || 0,
        totalCost: cost?.totalCost || 0,
        currency: cost?.currency || 'INR',
      },
      status: 'pending',
      timing: {
        submittedAt: new Date(),
      },
    });

    const savedJob = await newPrintJob.save();
    console.log(`✅ Print job created with ID: ${savedJob._id}`);

    // Add job to printer queue
    try {
      const queueResult = await printerService.addJobToQueue(printerId, savedJob._id);
      savedJob.queuePosition = queueResult.queuePosition;
      savedJob.status = 'queued';
      await savedJob.save();
      console.log(`📋 Job added to printer queue at position ${queueResult.queuePosition}`);
    } catch (error) {
      console.error('❌ Failed to add job to queue:', error);
      // Continue anyway, job will be processed by auto-processor
    }

    res.status(201).json({
      success: true,
      message: 'Print job created and queued successfully',
      data: {
        ...savedJob.toObject(),
        estimatedCost: `₹${savedJob.cost.totalCost.toFixed(2)}`
      },
    });

  } catch (error) {
    console.error('❌ Error creating print job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create print job',
      error: error.message,
    });
  }
};

/**
 * Print a specific job by ID
 */
const printJobById = async (req, res) => {
  let tempFilePath = null;

  try {
    const { id } = req.params;
    const { printerName } = req.body; // Optional specific printer

    console.log(`🖨️ Processing print request for job ID: ${id}`);

    // Find the print job
    const printJob = await PrintJob.findById(id).populate('printerId');
    if (!printJob) {
      return res.status(404).json({
        success: false,
        message: 'Print job not found',
      });
    }

    // Check if job is already completed
    if (printJob.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Print job already completed',
      });
    }

    // Update status to in-progress
    printJob.status = 'in-progress';
    printJob.timing.startedAt = new Date();
    await printJob.save();

    // Download file from Cloudinary using public ID (more reliable)
    console.log(`📥 Downloading file: ${printJob.file.originalName}`);
    console.log(`🔑 Using public ID: ${printJob.file.publicId}`);
    tempFilePath = await downloadFileByPublicId(
      printJob.file.publicId,
      printJob.file.originalName
    );

    // Print the file
    console.log(`🖨️ Printing file with settings:`, printJob.settings);
    console.log(`🖨️ Using printer ID: ${printJob.printerId}`);
    const printResult = await printFile(
      tempFilePath,
      printJob.settings,
      printerName,
      printJob.printerId // Pass printer ID for mapping
    );

    if (!printResult.success) {
      // Update job status to failed
      printJob.status = 'failed';
      printJob.errorMessage = printResult.error;
      printJob.timing.completedAt = new Date();
      await printJob.save();

      return res.status(500).json({
        success: false,
        message: 'Print job failed',
        error: printResult.error,
      });
    }

    // Update job status to completed
    printJob.status = 'completed';
    printJob.actualCompletionTime = new Date();
    printJob.timing.completedAt = new Date();
    printJob.timing.totalProcessingTime = printResult.processingTimeSeconds;
    await printJob.save();

    // Move job to PrintedJobs collection
    const printedJob = new PrintedJob({
      originalJobId: printJob._id,
      clerkUserId: printJob.clerkUserId,
      userName: printJob.userName,
      userEmail: printJob.userEmail,
      printerId: printJob.printerId,
      printerName: printResult.printerName,
      file: printJob.file,
      settings: printJob.settings,
      cost: printJob.cost,
      payment: printJob.payment,
      printedAt: new Date(),
      processingTimeSeconds: printResult.processingTimeSeconds,
    });

    await printedJob.save();
    console.log(`✅ Job moved to PrintedJobs collection: ${printedJob._id}`);

    // Send email notification for print completion
    if (printJob.userEmail) {
      try {
        const emailResult = await emailService.sendPrintCompletionNotification({
          ...printJob.toObject(),
          printerName: printResult.printerName,
          estimatedCost: printJob.cost.totalCost,
          pageCount: printJob.settings.pages === 'all' ? 'All' : printJob.settings.pages,
          printSettings: {
            quality: 'Standard',
            colorMode: printJob.settings.color ? 'Color' : 'Black & White'
          }
        });
        
        if (emailResult.success) {
          console.log(`📧 Print completion email sent to ${printJob.userEmail}`);
        } else {
          console.error(`❌ Failed to send email to ${printJob.userEmail}:`, emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Email service error:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Print job completed successfully',
      data: {
        jobId: printJob._id,
        printedJobId: printedJob._id,
        printerName: printResult.printerName,
        processingTime: printResult.processingTimeSeconds,
        emailSent: Boolean(printJob.userEmail),
      },
    });

  } catch (error) {
    console.error('❌ Error processing print job:', error);

    // Update job status to failed if we have the job
    let failedJob = null;
    try {
      if (req.params.id) {
        failedJob = await PrintJob.findByIdAndUpdate(req.params.id, {
          status: 'failed',
          errorMessage: error.message,
          'timing.completedAt': new Date(),
        }, { new: true });

        // Send error notification email
        if (failedJob && failedJob.userEmail) {
          try {
            await emailService.sendPrintErrorNotification(failedJob, error.message);
            console.log(`📧 Error notification sent to ${failedJob.userEmail}`);
          } catch (emailError) {
            console.error('❌ Failed to send error email:', emailError);
          }
        }
      }
    } catch (updateError) {
      console.error('❌ Failed to update job status:', updateError);
    }

    res.status(500).json({
      success: false,
      message: 'Print job processing failed',
      error: error.message,
    });

  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      await deleteTempFile(tempFilePath);
    }
  }
};

/**
 * Get all pending print jobs
 */
const getPendingJobs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const pendingJobs = await PrintJob.find({
      status: { $in: ['pending', 'queued'] }
    })
    .populate('printerId', 'name location')
    .sort({ 'timing.submittedAt': 1 }) // FIFO order
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalCount = await PrintJob.countDocuments({
      status: { $in: ['pending', 'queued'] }
    });

    console.log(`📋 Retrieved ${pendingJobs.length} pending jobs`);

    res.status(200).json({
      success: true,
      data: pendingJobs,
      pagination: {
        current: page,
        total: Math.ceil(totalCount / limit),
        count: pendingJobs.length,
        totalJobs: totalCount,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching pending jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending jobs',
      error: error.message,
    });
  }
};

/**
 * Get all printed/completed jobs
 */
const getPrintedJobs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId } = req.query;
    
    const filter = {};
    if (userId) {
      filter.clerkUserId = userId;
    }

    const printedJobs = await PrintedJob.find(filter)
      .populate('printerId', 'name location')
      .sort({ printedAt: -1 }) // Most recent first
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalCount = await PrintedJob.countDocuments(filter);

    console.log(`📋 Retrieved ${printedJobs.length} printed jobs`);

    res.status(200).json({
      success: true,
      data: printedJobs,
      pagination: {
        current: page,
        total: Math.ceil(totalCount / limit),
        count: printedJobs.length,
        totalJobs: totalCount,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching printed jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch printed jobs',
      error: error.message,
    });
  }
};

/**
 * Get job status by ID
 */
const getJobStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await PrintJob.findById(id)
      .populate('printerId', 'name location')
      .select('status timing errorMessage actualCompletionTime');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: job._id,
        status: job.status,
        timing: job.timing,
        errorMessage: job.errorMessage,
        actualCompletionTime: job.actualCompletionTime,
        printer: job.printerId,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job status',
      error: error.message,
    });
  }
};

module.exports = {
  createPrintJob,
  printJobById,
  getPendingJobs,
  getPrintedJobs,
  getJobStatus,
};