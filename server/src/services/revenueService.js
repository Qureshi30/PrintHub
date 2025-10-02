/**
 * Revenue Service
 * 
 * Handles automatic revenue record creation when print jobs are completed
 */

const Revenue = require('../models/Revenue');
const User = require('../models/User');

/**
 * Create a revenue record for a completed print job
 * @param {Object} printJob - The completed print job
 * @returns {Promise<Object>} The created revenue record
 */
const createRevenueRecord = async (printJob) => {
  try {
    // Check if revenue record already exists
    const existingRevenue = await Revenue.findOne({ printJobId: printJob._id });
    
    if (existingRevenue) {
      console.log(`⚠️  Revenue record already exists for print job: ${printJob._id}`);
      return existingRevenue;
    }

    // Get user email
    const user = await User.findOne({ clerkUserId: printJob.clerkUserId });
    const userEmail = user?.profile?.email || 'unknown@example.com';

    // Extract necessary data - use actual pricing from print job
    const revenueData = {
      printJobId: printJob._id,
      clerkUserId: printJob.clerkUserId,
      printerId: printJob.printerId,
      userEmail: userEmail,
      price: printJob.pricing?.totalCost || 0,
      paymentMethod: printJob.payment?.method || 'other',
      transactionId: printJob.payment?.transactionId,
      paidAt: printJob.payment?.paidAt || new Date()
    };

    // Create revenue record
    const revenue = await Revenue.create(revenueData);
    console.log(`💰 Revenue record created: $${revenue.price.toFixed(2)} for job ${printJob._id}`);

    return revenue;
  } catch (error) {
    console.error('❌ Error creating revenue record:', error);
    throw error;
  }
};

/**
 * Create revenue records for multiple print jobs
 * @param {Array} printJobs - Array of completed print jobs
 * @returns {Promise<Array>} Array of created revenue records
 */
const createBulkRevenueRecords = async (printJobs) => {
  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  for (const job of printJobs) {
    try {
      const revenue = await createRevenueRecord(job);
      if (revenue) {
        results.created.push(revenue);
      }
    } catch (error) {
      console.error(`❌ Error processing job ${job._id}:`, error.message);
      results.errors.push({ jobId: job._id, error: error.message });
    }
  }

  return results;
};

module.exports = {
  createRevenueRecord,
  createBulkRevenueRecords
};
