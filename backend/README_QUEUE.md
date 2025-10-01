# Print Queue System

## Overview

This implementation provides a robust print queue system using Express.js and Mongoose with two main collections:

1. **PrintJob** - Contains full job details (existing collection)
2. **Queue** - Contains minimal queue management info (new collection)

## Features

- **First-Come-First-Serve Ordering**: Jobs are automatically assigned sequential positions
- **Automatic Queue Management**: Jobs are added to queue when created with "pending" status
- **Position Reassignment**: When jobs complete/fail, remaining jobs automatically shift positions
- **Transaction Safety**: All queue operations use MongoDB transactions for consistency
- **Queue Processing**: Background processor continuously handles jobs
- **Status Synchronization**: Queue status always mirrors PrintJob status

## Models

### Queue Schema
```javascript
{
  printJobId: ObjectId,     // Reference to PrintJob
  position: Number,         // Queue position (1, 2, 3...)
  status: String,          // pending, in-progress, completed, failed
  createdAt: Date,         // Auto-generated
  updatedAt: Date          // Auto-generated
}
```

### Status Flow
```
PrintJob Created (pending) → Added to Queue (position assigned)
Queue Position 1 → Picked by Processor → Status: in-progress
Printer Success → PrintJob: completed → Removed from Queue → Positions reassigned
Printer Failure → PrintJob: failed → Removed from Queue → Positions reassigned
```

## API Endpoints

### Queue Management
- `GET /api/queue` - Get current queue (ordered by position)
- `GET /api/queue/stats` - Get queue statistics
- `GET /api/queue/next` - Get next job to process
- `POST /api/queue/add` - Manually add job to queue
- `PUT /api/queue/complete` - Mark job as completed
- `PUT /api/queue/fail` - Mark job as failed
- `GET /api/queue/position/:printJobId` - Get job's queue position

### Print Job Integration
- `POST /api/print-jobs` - Create job (auto-queued if pending)
- `GET /api/print-jobs/:id` - Get job with queue info

### Queue Processor Control
- `POST /api/queue/processor/start` - Start background processor
- `POST /api/queue/processor/stop` - Stop background processor
- `GET /api/queue/processor/status` - Get processor status

## Usage Examples

### 1. Create a Print Job (Auto-queued)
```javascript
const result = await PrintJobService.createPrintJob({
  userId: "user123",
  files: [{ name: "document.pdf", pages: 5 }],
  totalCost: 5.00,
  estimatedPages: 5
});

// Result includes queue position
console.log(`Job created at queue position ${result.queuePosition}`);
```

### 2. Check Queue Status
```javascript
const queue = await QueueManager.getCurrentQueue();
queue.forEach(item => {
  console.log(`Position ${item.position}: Job ${item.printJobId} (${item.status})`);
});
```

### 3. Process Next Job
```javascript
const nextJob = await QueueManager.getNextJob();
if (nextJob) {
  await QueueManager.markInProgress(nextJob._id);
  // Send to printer...
  await QueueManager.completeJob(nextJob.printJobId);
}
```

## Key Classes

### QueueManager
- `enqueue(printJobId)` - Add job to queue
- `getNextJob()` - Get job at position 1
- `markInProgress(queueItemId)` - Start processing job
- `completeJob(printJobId)` - Complete and remove job
- `failJob(printJobId, error)` - Fail and remove job
- `getCurrentQueue(limit)` - Get ordered queue
- `getQueueStats()` - Get statistics

### QueueProcessor
- Automatically processes jobs every 5 seconds
- Picks job at position 1 with status "pending"
- Simulates printer communication
- Handles success/failure outcomes
- `start()` / `stop()` / `getStatus()` methods

### PrintJobService
- `createPrintJob(data)` - Create job + auto-queue
- `updatePrintJobStatus(id, status)` - Update with queue sync
- `getPrintJobWithQueue(id)` - Get job with queue info

## Database Indexes

The Queue collection includes optimized indexes for:
- Position + Status queries
- Status + Position queries
- Unique position constraint for active jobs

## Error Handling

- Validates status transitions (pending → in-progress → completed/failed)
- Prevents duplicate queue entries
- Handles orphaned queue items
- Transaction rollback on failures
- Graceful degradation if queue operations fail

## Installation

1. Copy the files to your Express.js project
2. Install dependencies: `mongoose`
3. Import and use in your server:
   ```javascript
   const queueRoutes = require('./routes/queue');
   const queueProcessor = require('./services/queueProcessor');
   
   app.use('/api/queue', queueRoutes);
   queueProcessor.start();
   ```

## Monitoring

The system provides comprehensive logging:
- ✅ Job completed
- ❌ Job failed  
- 🟡 Job in progress
- 🔄 Position reassignment
- 📄 Job details
- 🧹 Cleanup operations

This ensures you can monitor queue health and troubleshoot issues effectively.