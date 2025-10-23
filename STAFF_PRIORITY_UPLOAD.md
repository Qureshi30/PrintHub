# Staff-Only File Upload with Backend Priority System

## Overview
This document describes the staff-only file upload system with backend priority implementation for the PrintHub project.

## Features Implemented

### 1. User Roles
- **Student (user)**: Default role, can upload files with normal priority
- **Staff**: Can upload files with high priority (processed first)
- **Admin**: Can create staff users but **CANNOT** upload files

### 2. Priority System

#### Priority Field in PrintJob Model
```javascript
priority: {
  type: String,
  enum: ['normal', 'high'],
  default: 'normal',
  index: true,
}
```

#### Priority Assignment Logic
- **Staff uploads**: Automatically assigned `priority: "high"`
- **Student uploads**: Automatically assigned `priority: "normal"`
- **Admin uploads**: Blocked with error message

### 3. Backend Queue Priority

#### Queue Ordering
All print job queries now sort by priority first, then by creation time:
```javascript
.sort({ priority: -1, createdAt: 1 })
```

This ensures:
1. High priority jobs (staff uploads) are processed first
2. Within the same priority level, older jobs are processed first

#### QueueManager Enhancement
The `QueueManager.enqueue()` method now:
- Checks the print job's priority field
- For high priority jobs:
  - Finds the position after the last high priority job
  - Inserts the new job at that position
  - Shifts all lower priority jobs down
- For normal priority jobs:
  - Adds them to the end of the queue

### 4. Access Control

#### New Middleware Functions
```javascript
// Staff-only access
requireStaff(req, res, next)

// Staff or Admin access
requireStaffOrAdmin(req, res, next)
```

#### Upload Restrictions
- Only **staff** users can upload files
- **Admin** users receive a 403 Forbidden error with message:
  ```
  "Admin users cannot upload files. Only staff members can upload."
  ```
- **Students** can upload with normal priority (if allowed by business rules)

### 5. Modified Routes

#### Print Job Creation (`POST /api/print-jobs`)
```javascript
// Block admin uploads
if (req.user?.role === 'admin') {
  return res.status(403).json({
    success: false,
    error: {
      message: 'Admin users cannot upload files. Only staff members can upload.',
      code: 'ADMIN_UPLOAD_FORBIDDEN'
    }
  });
}

// Set priority based on role
const priority = req.user?.role === 'staff' ? 'high' : 'normal';
```

#### Print Job Retrieval
All routes now sort by priority:
- `GET /api/print-jobs/user/:clerkUserId` - Sort by priority, then createdAt
- `GET /api/print-jobs` (Admin) - Sort by priority, then createdAt
- `GET /students/print-jobs` - Sort by priority, then createdAt

## Database Schema Changes

### PrintJob Model
Added priority field with index for efficient querying:
```javascript
printJobSchema.index({ priority: -1, createdAt: 1 });
```

## API Endpoints

### Admin: Create Staff User
```
POST /api/admin/create-user
Authorization: Bearer <admin_token>

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.staff@example.com",
  "password": "SecurePass123!",
  "role": "staff"
}
```

### Staff: Upload File (Create Print Job)
```
POST /api/print-jobs
Authorization: Bearer <staff_token>

Body:
{
  "clerkUserId": "<staff_clerk_user_id>",
  "printerId": "<printer_id>",
  "file": {
    "cloudinaryUrl": "...",
    "publicId": "...",
    "originalName": "document.pdf",
    "format": "pdf",
    "sizeKB": 1024
  },
  "settings": {
    "pages": "all",
    "copies": 1,
    "color": false,
    "duplex": false,
    "paperType": "A4"
  }
}

Response (Success):
{
  "success": true,
  "data": {
    ...
    "priority": "high",
    "queue": {
      "position": 1,
      "addedToQueue": true
    }
  }
}
```

### Admin: Attempt Upload (Should Fail)
```
POST /api/print-jobs
Authorization: Bearer <admin_token>

Response (403 Forbidden):
{
  "success": false,
  "error": {
    "message": "Admin users cannot upload files. Only staff members can upload.",
    "code": "ADMIN_UPLOAD_FORBIDDEN"
  }
}
```

## Frontend Implications

### No Changes Required
- Staff users see the same upload page as students
- The backend automatically handles priority assignment
- UI remains unchanged

### Optional Enhancements (Future)
- Display priority badge in print job lists
- Show queue position with priority indicator
- Add priority filter in admin dashboard

## Testing

### Test Scenarios

1. **Staff Upload**
   - ✅ Staff user can upload files
   - ✅ Upload gets `priority: "high"`
   - ✅ Job is inserted at high priority position in queue

2. **Admin Upload Block**
   - ✅ Admin user receives 403 error when attempting upload
   - ✅ Error message clearly states restriction

3. **Queue Priority**
   - ✅ High priority jobs appear before normal priority jobs
   - ✅ Within same priority, older jobs come first
   - ✅ Queue positions are maintained correctly

4. **Admin User Creation**
   - ✅ Admin can create staff users via `/api/admin/create-user`
   - ✅ Staff role is properly assigned

## Error Codes

| Code | Meaning |
|------|---------|
| `ADMIN_UPLOAD_FORBIDDEN` | Admin tried to upload a file |
| `STAFF_REQUIRED` | Endpoint requires staff role |
| `STAFF_OR_ADMIN_REQUIRED` | Endpoint requires staff or admin role |

## Migration Notes

### Existing Print Jobs
- Existing print jobs without priority field will default to "normal"
- MongoDB index on priority will be created automatically
- No data migration required

### Backward Compatibility
- All existing queries continue to work
- Priority sorting is additive (doesn't break existing functionality)

## Performance Considerations

- Added compound index on `{ priority: -1, createdAt: 1 }` for efficient querying
- Queue position calculations optimized with transactions
- High priority job insertion uses bulk update for position shifting

## Security

- Role-based access control enforced at middleware level
- Clerk authentication verifies user identity
- Priority cannot be manipulated by client (set server-side only)
- Admin cannot bypass upload restrictions

## Monitoring

### Log Messages
- `✅ Print job {id} added to queue at position {pos} (HIGH PRIORITY)` - High priority job queued
- `❌ Access denied: User {id} has role "admin" but "staff" required` - Admin upload blocked
- `✅ Staff access granted for user: {id}` - Staff user authenticated

## Future Enhancements

1. **Multiple Priority Levels**
   - Add "urgent", "high", "normal", "low" priorities
   - Implement priority boost for waiting jobs

2. **Dynamic Priority**
   - Auto-escalate jobs waiting too long
   - Department-based priority rules

3. **Priority Analytics**
   - Track average processing time by priority
   - Priority usage statistics

4. **Admin Override**
   - Allow admin to modify job priority manually
   - Emergency print queue insertion

## Conclusion

The staff-only file upload with backend priority system is fully implemented and operational. Staff members can upload files that are automatically prioritized in the queue, ensuring faster processing. Admin users are restricted from uploading files while maintaining their ability to create and manage staff accounts.
