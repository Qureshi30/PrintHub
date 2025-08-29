# PrintHub Database Integration

This document outlines the MongoDB database integration with Cloudinary file storage for the PrintHub application.

## Database Schema

### Collections

#### 1. Users
Stores user account information linked to Clerk authentication.

```typescript
interface User {
  _id: string;
  clerkUserId: string;
  role: 'student' | 'admin' | 'staff';
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. PrintJobs
Core collection for managing print jobs with Cloudinary file references.

```typescript
interface PrintJob {
  _id: string;
  clerkUserId: string;
  printerId: string;
  file: {
    cloudinaryUrl: string;
    publicId: string;
    format: string;
    sizeKB: number;
  };
  settings: {
    pages: string;
    copies: number;
    color: boolean;
    duplex: boolean;
    paperType: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Certificate';
  };
  status: 'pending' | 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled';
  queuePosition?: number;
  estimatedCompletionTime?: Date;
  misprint: boolean;
  reprintCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. Printers
Manages printer information and status.

```typescript
interface Printer {
  _id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' | 'busy';
  queue: string[]; // Array of job IDs
  supportedPaperTypes: string[];
  inkLevel: number;
  paperLevel: number;
  lastChecked: Date;
}
```

#### 4. Notifications
User notification system.

```typescript
interface Notification {
  _id: string;
  clerkUserId: string;
  jobId?: string;
  type: 'job_completed' | 'job_failed' | 'reprint' | 'queue_update' | 'maintenance';
  message: string;
  read: boolean;
  createdAt: Date;
}
```

#### 5. AdminLogs
Administrative action tracking.

```typescript
interface AdminLog {
  _id: string;
  adminId: string;
  action: 'reprint' | 'cancel_job' | 'printer_maintenance' | 'user_action';
  jobId?: string;
  printerId?: string;
  userId?: string;
  timestamp: Date;
  notes?: string;
}
```

## File Storage with Cloudinary

### Upload Process
1. User selects files through the enhanced file uploader
2. Files are validated (type, size, format)
3. Files are uploaded to Cloudinary with organized folder structure
4. Print job records are created in MongoDB with Cloudinary references
5. Users can proceed to configure print settings

### Folder Structure
```
print_jobs/
├── {clerkUserId}/
│   ├── {jobId1}.pdf
│   ├── {jobId2}.docx
│   └── ...
```

### File Management
- Maximum file size: 10MB
- Supported formats: PDF, DOC/DOCX, Images, TXT, XLS/XLSX, PPT/PPTX
- Automatic file cleanup on job completion
- Secure URL generation for file preview

## API Integration

### React Query Hooks
The application uses React Query for efficient data fetching and caching:

- `useCurrentUser()` - Get current user information
- `useUserPrintJobs()` - Fetch user's print jobs
- `useCreatePrintJob()` - Create new print job
- `usePrinters()` - Get available printers
- `useUserNotifications()` - Fetch user notifications
- `useDashboardStats()` - Get dashboard statistics

### API Endpoints
```
GET    /api/users/clerk/{clerkUserId}     - Get user by Clerk ID
POST   /api/users/get-or-create          - Get or create user
GET    /api/print-jobs/user/{clerkUserId} - Get user print jobs
POST   /api/print-jobs                   - Create print job
GET    /api/printers                     - Get all printers
GET    /api/printers/available           - Get available printers
GET    /api/notifications/user/{clerkUserId} - Get user notifications
```

## Environment Configuration

### Required Environment Variables
```env
# Database Configuration
VITE_MONGODB_URI=mongodb://localhost:27017/printhub
VITE_API_BASE_URL=http://localhost:3001/api

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_CLOUDINARY_API_KEY=your_api_key

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Features Implemented

### Student Dashboard
- Real-time statistics from database
- Pending jobs count
- Completed jobs count
- Total spending calculation
- Available printers status

### Enhanced File Upload
- Cloudinary integration
- File validation
- Progress tracking
- Error handling
- Database job creation

### Data Management
- Automatic user creation on first login
- Print job lifecycle management
- Printer status monitoring
- Notification system
- Admin activity logging

## Next Steps

1. **Backend API Development**: Create Node.js/Express API server with MongoDB
2. **Database Setup**: Initialize MongoDB with proper indexes and schemas
3. **Cloudinary Configuration**: Set up upload presets and security settings
4. **Real-time Updates**: Implement WebSocket for live print queue updates
5. **Payment Integration**: Add cost calculation and payment processing
6. **Admin Dashboard**: Complete admin functionality for printer management

## Security Considerations

- File upload validation and sanitization
- Secure Cloudinary URLs with signed access
- Role-based access control
- Rate limiting for uploads
- File size and type restrictions
- Automatic file cleanup policies
