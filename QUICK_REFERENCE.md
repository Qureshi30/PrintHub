# Staff Priority Upload - Quick Reference

## Quick Start

### For Backend Developers

#### Check if a user can upload:
```javascript
// Staff can upload
if (req.user?.role === 'staff') {
  // Create print job with priority: 'high'
}

// Students can upload
if (req.user?.role === 'student') {
  // Create print job with priority: 'normal'
}

// Admin cannot upload
if (req.user?.role === 'admin') {
  // Return 403 Forbidden
}
```

#### Create a staff user (Admin only):
```bash
POST /api/admin/create-user
{
  "firstName": "John",
  "lastName": "Staff",
  "email": "john.staff@example.com",
  "password": "SecurePassword123!",
  "role": "staff"
}
```

#### Query print jobs with priority:
```javascript
// Always sort by priority first
PrintJob.find(filter)
  .sort({ priority: -1, createdAt: 1 })
  .limit(20);
```

### For Frontend Developers

**No changes needed!** The backend automatically handles:
- Priority assignment based on user role
- Queue positioning
- Access control

Optional: Display priority in UI
```javascript
// In print job list
{job.priority === 'high' && (
  <Badge variant="destructive">High Priority</Badge>
)}
```

## Middleware Usage

### Protect staff-only endpoints:
```javascript
const { requireStaff } = require('../middleware/authMiddleware');

router.post('/staff-only-endpoint', requireStaff, async (req, res) => {
  // Only staff can access this
});
```

### Allow staff OR admin:
```javascript
const { requireStaffOrAdmin } = require('../middleware/authMiddleware');

router.get('/staff-admin-endpoint', requireStaffOrAdmin, async (req, res) => {
  // Both staff and admin can access
});
```

## Error Codes

| Code | HTTP | Meaning | Action |
|------|------|---------|--------|
| `ADMIN_UPLOAD_FORBIDDEN` | 403 | Admin tried to upload | Show error message |
| `STAFF_REQUIRED` | 403 | Endpoint needs staff role | Redirect to login or show error |
| `STAFF_OR_ADMIN_REQUIRED` | 403 | Endpoint needs staff/admin | Check user permissions |

## Database Queries

### Get high priority jobs only:
```javascript
await PrintJob.find({ priority: 'high' })
  .sort({ createdAt: 1 });
```

### Get queue with priority:
```javascript
await QueueManager.getCurrentQueue(50);
// Returns jobs with priority field populated
```

### Check job priority:
```javascript
const job = await PrintJob.findById(jobId);
if (job.priority === 'high') {
  console.log('This is a staff upload');
}
```

## Testing Commands

### Run test suite:
```bash
cd server
node test-staff-priority.js
```

### Manual testing:
```bash
# Test admin upload (should fail)
curl -X POST http://localhost:3001/api/print-jobs \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"clerkUserId":"...","printerId":"...","file":{...}}'

# Expected: 403 Forbidden with ADMIN_UPLOAD_FORBIDDEN
```

## Common Scenarios

### Scenario 1: Staff uploads a document
```
1. Staff user logs in (role: 'staff')
2. Uploads file via /api/print-jobs
3. Backend sets priority: 'high'
4. Job inserted at front of queue (before normal priority jobs)
5. Staff user sees job in their list with high priority
```

### Scenario 2: Admin tries to upload
```
1. Admin user logs in (role: 'admin')
2. Attempts to upload via /api/print-jobs
3. Backend blocks with 403 error
4. Error message: "Admin users cannot upload files. Only staff members can upload."
5. Admin can still view all jobs and manage users
```

### Scenario 3: Mixed priority queue
```
Queue before staff upload:
1. Student Job A (normal, 10:00)
2. Student Job B (normal, 10:05)
3. Student Job C (normal, 10:10)

Staff uploads at 10:12:
Queue after:
1. Staff Job D (high, 10:12) ← Inserted at front
2. Student Job A (normal, 10:00)
3. Student Job B (normal, 10:05)
4. Student Job C (normal, 10:10)

Another staff uploads at 10:15:
1. Staff Job D (high, 10:12)
2. Staff Job E (high, 10:15) ← After last high priority job
3. Student Job A (normal, 10:00)
4. Student Job B (normal, 10:05)
5. Student Job C (normal, 10:10)
```

## Troubleshooting

### Issue: Staff can't upload
**Check:**
1. User role in Clerk: `publicMetadata.role === 'staff'`
2. Auth token is valid
3. Printer exists and is available

**Solution:**
```bash
# Update user role in Clerk
await clerkClient.users.updateUser(userId, {
  publicMetadata: { role: 'staff' }
});
```

### Issue: Priority not showing
**Check:**
1. Database index created: `db.printjobs.getIndexes()`
2. Print job has priority field: `db.printjobs.findOne()`
3. Query includes priority in select/populate

**Solution:**
```javascript
// Ensure priority field is included
.select('priority file status createdAt')
```

### Issue: Queue order is wrong
**Check:**
1. Sort order in query: `.sort({ priority: -1, createdAt: 1 })`
2. Priority values are correct ('high' or 'normal')
3. QueueManager.enqueue() is being called

**Debug:**
```javascript
const jobs = await PrintJob.find().sort({ priority: -1, createdAt: 1 });
jobs.forEach(job => {
  console.log(`${job.priority}: ${job.file.originalName}`);
});
```

## Best Practices

### ✅ Do:
- Always use middleware for role-based access control
- Sort queries by priority first, then other criteria
- Log priority-related actions for debugging
- Handle 403 errors gracefully in frontend
- Test with different user roles

### ❌ Don't:
- Accept priority from client-side requests
- Bypass role checks in middleware
- Assume priority field exists (use default)
- Hardcode priority values (use enum)
- Skip transaction for queue operations

## Performance Tips

1. **Use indexes**: Priority queries use compound index
2. **Limit results**: Don't fetch entire queue
3. **Batch operations**: Use bulkWrite for position updates
4. **Cache roles**: Clerk role already cached in req.user

## Security Checklist

- ✅ Priority set server-side only
- ✅ Role verified via Clerk authentication
- ✅ Middleware enforces access control
- ✅ Admin upload blocked at route level
- ✅ No client-side priority manipulation possible

## API Quick Reference

### Print Job Creation
```
POST /api/print-jobs
Auth: Required (staff or student only)
Priority: Auto-set based on role
Response: Includes priority and queue position
```

### Get User's Print Jobs
```
GET /api/print-jobs/user/:clerkUserId
Auth: Required (user or admin)
Sort: Priority desc, createdAt asc
Response: Jobs sorted by priority
```

### Get All Print Jobs (Admin)
```
GET /api/print-jobs
Auth: Admin only
Sort: Priority desc, createdAt asc
Query: ?status=pending&printerId=xxx
```

### Create Staff User (Admin)
```
POST /api/admin/create-user
Auth: Admin only
Body: {firstName, lastName, email, password, role: 'staff'}
Response: Created user with role
```

## Resources

- Full Documentation: `STAFF_PRIORITY_UPLOAD.md`
- Implementation Details: `IMPLEMENTATION_SUMMARY.md`
- Test Suite: `server/test-staff-priority.js`
- Models: `server/src/models/PrintJob.js`
- Middleware: `server/src/middleware/authMiddleware.js`
- Routes: `server/src/routes/printJobRoutes.js`
