const express = require('express');
const router = express.Router();
const QueueManager = require('../services/queueManager');
const Queue = require('../models/Queue');
const PrintJob = require('../models/PrintJob');

/**
 * GET /api/queue
 * Get the current print queue ordered by position
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const queue = await QueueManager.getCurrentQueue(limit);
    
    res.json({
      success: true,
      data: queue,
      total: queue.length
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch print queue',
      error: error.message
    });
  }
});

/**
 * GET /api/queue/stats
 * Get queue statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await QueueManager.getQueueStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch queue statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/queue/next
 * Get the next job in queue (position 1, status pending)
 */
router.get('/next', async (req, res) => {
  try {
    const nextJob = await QueueManager.getNextJob();
    
    if (!nextJob) {
      return res.json({
        success: true,
        data: null,
        message: 'No pending jobs in queue'
      });
    }
    
    res.json({
      success: true,
      data: nextJob
    });
  } catch (error) {
    console.error('Error fetching next job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch next job',
      error: error.message
    });
  }
});

/**
 * POST /api/queue/add
 * Add a print job to the queue
 * Body: { printJobId: "ObjectId" }
 */
router.post('/add', async (req, res) => {
  try {
    const { printJobId } = req.body;
    
    if (!printJobId) {
      return res.status(400).json({
        success: false,
        message: 'printJobId is required'
      });
    }
    
    const queueItem = await QueueManager.enqueue(printJobId);
    
    res.status(201).json({
      success: true,
      data: queueItem,
      message: `Print job added to queue at position ${queueItem.position}`
    });
  } catch (error) {
    console.error('Error adding job to queue:', error);
    
    // Handle specific error cases
    let statusCode = 500;
    if (error.message.includes('not found') || error.message.includes('already in queue')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: 'Failed to add job to queue',
      error: error.message
    });
  }
});

/**
 * PUT /api/queue/:id/start
 * Mark a queue item as in-progress
 */
router.put('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    const queueItem = await QueueManager.markInProgress(id);
    
    res.json({
      success: true,
      data: queueItem,
      message: 'Job marked as in-progress'
    });
  } catch (error) {
    console.error('Error starting job:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found') || error.message.includes('Only pending')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: 'Failed to start job',
      error: error.message
    });
  }
});

/**
 * PUT /api/queue/complete
 * Mark a print job as completed and remove from queue
 * Body: { printJobId: "ObjectId" }
 */
router.put('/complete', async (req, res) => {
  try {
    const { printJobId } = req.body;
    
    if (!printJobId) {
      return res.status(400).json({
        success: false,
        message: 'printJobId is required'
      });
    }
    
    await QueueManager.completeJob(printJobId);
    
    res.json({
      success: true,
      message: 'Job completed and removed from queue'
    });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete job',
      error: error.message
    });
  }
});

/**
 * PUT /api/queue/fail
 * Mark a print job as failed and remove from queue
 * Body: { printJobId: "ObjectId", errorMessage?: "string" }
 */
router.put('/fail', async (req, res) => {
  try {
    const { printJobId, errorMessage } = req.body;
    
    if (!printJobId) {
      return res.status(400).json({
        success: false,
        message: 'printJobId is required'
      });
    }
    
    await QueueManager.failJob(printJobId, errorMessage);
    
    res.json({
      success: true,
      message: 'Job marked as failed and removed from queue'
    });
  } catch (error) {
    console.error('Error failing job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark job as failed',
      error: error.message
    });
  }
});

/**
 * POST /api/queue/cleanup
 * Clean up orphaned queue items
 */
router.post('/cleanup', async (req, res) => {
  try {
    const cleanedCount = await QueueManager.cleanupOrphanedItems();
    
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} orphaned queue items`
    });
  } catch (error) {
    console.error('Error cleaning up queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup queue',
      error: error.message
    });
  }
});

/**
 * GET /api/queue/position/:printJobId
 * Get the position of a specific print job in the queue
 */
router.get('/position/:printJobId', async (req, res) => {
  try {
    const { printJobId } = req.params;
    
    const queueItem = await Queue.findOne({ printJobId })
      .select('position status createdAt updatedAt');
    
    if (!queueItem) {
      return res.status(404).json({
        success: false,
        message: 'Print job not found in queue'
      });
    }
    
    res.json({
      success: true,
      data: {
        printJobId,
        position: queueItem.position,
        status: queueItem.status,
        createdAt: queueItem.createdAt,
        updatedAt: queueItem.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching job position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job position',
      error: error.message
    });
  }
});

module.exports = router;