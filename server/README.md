# PrintHub Backend Server

A comprehensive Node.js/Express API server for the PrintHub printing management system, featuring MongoDB integration, Cloudinary file storage, and Clerk authentication.

## Features

- 🔐 **Authentication**: Clerk integration for secure user management
- 📁 **File Storage**: Cloudinary integration for document uploads
- 📊 **Database**: MongoDB with Mongoose ODM
- 🖨️ **Print Management**: Complete print job lifecycle management
- 📨 **Notifications**: Real-time user notifications
- 👥 **Admin Tools**: Comprehensive admin logging and management
- 🛡️ **Security**: Rate limiting, input validation, and proper error handling
- 📝 **API Documentation**: RESTful API with comprehensive validation

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account
- Clerk account

### Installation

1. **Clone and install dependencies:**
```bash
cd server
npm install
```

2. **Environment setup:**
```bash
# Copy environment template
node setup.js --env

# Edit .env file with your configuration
# See .env.example for all required variables
```

3. **Database setup:**
```bash
# Setup database with sample data
node setup.js

# Or reset database (WARNING: deletes all data)
node setup.js --reset
```

4. **Start the server:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will be available at `http://localhost:3001`

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/printhub

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=printhub_uploads

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Security
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=http://localhost:5173

# File Upload Limits
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,xls,xlsx,ppt,pptx,jpg,jpeg,png
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Users
- `GET /api/users/clerk/:clerkUserId` - Get user by Clerk ID
- `POST /api/users/get-or-create` - Get or create user
- `PUT /api/users/clerk/:clerkUserId` - Update user
- `GET /api/users/clerk/:clerkUserId/stats` - Get user statistics
- `GET /api/users` - Get all users (Admin only)

### Print Jobs
- `POST /api/print-jobs` - Create print job
- `GET /api/print-jobs/user/:clerkUserId` - Get user's print jobs
- `GET /api/print-jobs/:id` - Get specific print job
- `PUT /api/print-jobs/:id/cancel` - Cancel print job
- `DELETE /api/print-jobs/:id` - Delete print job (Admin only)
- `GET /api/print-jobs` - Get all print jobs (Admin only)

### Printers
- `GET /api/printers` - Get all printers
- `GET /api/printers/available` - Get available printers
- `GET /api/printers/:id` - Get specific printer
- `POST /api/printers` - Create printer (Admin only)
- `PUT /api/printers/:id` - Update printer (Admin only)
- `DELETE /api/printers/:id` - Delete printer (Admin only)
- `POST /api/printers/:id/maintenance` - Set maintenance mode (Admin only)
- `GET /api/printers/:id/queue` - Get printer queue

### Notifications
- `GET /api/notifications/user/:clerkUserId` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/user/:clerkUserId/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications` - Create notification
- `GET /api/notifications/user/:clerkUserId/unread-count` - Get unread count
- `DELETE /api/notifications/user/:clerkUserId/cleanup` - Cleanup old notifications

### File Upload
- `POST /api/upload/file` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `GET /api/upload/signature` - Get signed upload parameters
- `DELETE /api/upload/:publicId` - Delete file
- `POST /api/upload/validate` - Validate file
- `GET /api/upload/limits` - Get upload limits

### Admin Logs
- `POST /api/admin-logs` - Create admin log entry
- `GET /api/admin-logs` - Get admin logs
- `GET /api/admin-logs/admin/:adminId` - Get logs by admin
- `GET /api/admin-logs/action/:action` - Get logs by action
- `GET /api/admin-logs/critical` - Get critical actions
- `GET /api/admin-logs/audit/:targetType/:targetId` - Get audit trail
- `GET /api/admin-logs/stats` - Get admin statistics

## Database Schema

### Collections

- **Users**: User account information and preferences
- **PrintJobs**: Print job records with Cloudinary file references
- **Printers**: Printer information, status, and queue management
- **Notifications**: User notification system
- **AdminLogs**: Administrative action tracking

See `DATABASE_INTEGRATION.md` for detailed schema information.

## Security Features

- **Rate Limiting**: API endpoints protected with configurable rate limits
- **Input Validation**: Comprehensive validation using express-validator
- **File Upload Security**: File type and size validation
- **Authentication**: Clerk-based authentication with role-based access
- **Error Handling**: Secure error responses that don't leak sensitive information
- **CORS**: Configurable CORS settings

## Development

### Project Structure
```
server/
├── src/
│   ├── config/          # Database and service configurations
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route handlers
│   └── index.js         # Main server file
├── setup.js             # Database setup script
└── package.json
```

### Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
node setup.js      # Setup database with sample data
node setup.js --reset     # Reset database
node setup.js --env       # Create .env from template
```

### Testing

The server includes comprehensive error handling and logging. In development mode, detailed error information is provided for debugging.

## Deployment

### Prerequisites for Production

1. MongoDB Atlas or hosted MongoDB instance
2. Cloudinary account with upload presets configured
3. Clerk production keys
4. Secure environment variable management

### Environment Setup

1. Set `NODE_ENV=production`
2. Use secure MongoDB connection string
3. Configure production CORS origins
4. Set strong JWT secrets
5. Configure proper logging

### Monitoring

The server includes:
- Health check endpoint for load balancers
- Comprehensive logging for debugging
- Error tracking and reporting
- Admin activity logging

## Support

For issues and questions:
1. Check the API documentation
2. Review the error logs
3. Verify environment configuration
4. Test with sample data using the setup script

## License

MIT License - see LICENSE file for details.
