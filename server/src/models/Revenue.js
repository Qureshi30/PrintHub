const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  printJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintJob',
    required: true,
    index: true
  },
  clerkUserId: {
    type: String,
    required: true,
    index: true
  },
  printerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'cash', 'upi', 'wallet', 'student_credit', 'dev', 'razorpay', 'other']
  },
  transactionId: {
    type: String,
    sparse: true // Allows null but creates unique index only for non-null values
  },
  paidAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for better query performance
revenueSchema.index({ paidAt: -1 });
revenueSchema.index({ clerkUserId: 1, paidAt: -1 });
revenueSchema.index({ printerId: 1, paidAt: -1 });

// Virtual to get revenue by date range
revenueSchema.statics.getTotalRevenue = async function(startDate, endDate) {
  const match = {};
  if (startDate) match.paidAt = { $gte: new Date(startDate) };
  if (endDate) match.paidAt = { ...match.paidAt, $lte: new Date(endDate) };

  const result = await this.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);

  return result.length > 0 ? result[0].total : 0;
};

// Get revenue by printer
revenueSchema.statics.getRevenueByPrinter = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$printerId',
        totalRevenue: { $sum: '$price' },
        jobCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'printers',
        localField: '_id',
        foreignField: '_id',
        as: 'printerInfo'
      }
    },
    {
      $unwind: {
        path: '$printerInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        printerId: '$_id',
        printerName: '$printerInfo.name',
        location: '$printerInfo.location',
        totalRevenue: 1,
        jobCount: 1,
        avgRevenuePerJob: { $divide: ['$totalRevenue', '$jobCount'] }
      }
    }
  ]);
};

// Get revenue by user
revenueSchema.statics.getRevenueByUser = async function(limit = 10) {
  return await this.aggregate([
    {
      $group: {
        _id: '$clerkUserId',
        email: { $first: '$userEmail' },
        totalSpent: { $sum: '$price' },
        jobCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
    {
      $project: {
        clerkUserId: '$_id',
        email: 1,
        totalSpent: 1,
        jobCount: 1,
        avgSpentPerJob: { $divide: ['$totalSpent', '$jobCount'] }
      }
    }
  ]);
};

const Revenue = mongoose.model('Revenue', revenueSchema);

module.exports = Revenue;
