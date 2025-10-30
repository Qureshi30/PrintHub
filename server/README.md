# 🖨️ PrintHub Backend Server

A comprehensive Node.js/Express API server for the PrintHub printing management system, featuring MongoDB integration, Cloudinary file storage, SNMP printer monitoring, and real-time communication via Socket.IO.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io&logoColor=white)](https://socket.io/)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Environment Configuration](#-environment-configuration)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Services & Utilities](#-services--utilities)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🎯 Overview

The PrintHub backend server is a robust, scalable RESTful API built with Node.js and Express.js. It handles all business logic, data management, authentication, file processing, printer communication, and real-time notifications for the PrintHub printing management system.

### Core Responsibilities

- **Authentication & Authorization**: Clerk integration with role-based access control
- **Print Job Management**: Complete lifecycle management from submission to completion
- **Printer Communication**: SNMP monitoring and status tracking
- **File Storage**: Cloudinary integration for document management
- **Queue Management**: Intelligent priority-based job queuing
- **Payment Processing**: Razorpay integration and cash payment workflows
- **Real-time Updates**: Socket.IO for live notifications and status updates
- **Email Notifications**: Automated email system for queries and job updates
- **Error Handling**: Comprehensive error detection and logging

---

## ✨ Key Features

### 🔐 Authentication & Authorization

- **Clerk Integration**: Secure JWT-based authentication
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access, user management, printer configuration
  - **Staff**: Priority uploads, limited admin capabilities
  - **Student**: Standard print operations, personal dashboard
- **Session Management**: Automatic session handling and refresh
- **Middleware Protection**: Route-level authentication enforcement

### 📁 File Management

- **Cloudinary Integration**: Secure cloud storage with CDN delivery
- **Multi-format Support**: PDF, DOC, DOCX, PPT, PPTX, images
- **File Validation**: Type checking, size limits (10MB default)
- **Signed Upload URLs**: Secure client-side uploads
- **Automatic Cleanup**: Temp file management
- **File Metadata**: Original filename, format, size tracking

### 🖨️ Printer Management

- **CRUD Operations**: Complete printer lifecycle management
- **Real-time Status Tracking**: Online, offline, maintenance, busy states
- **SNMP Monitoring**: Automatic hardware status detection
  - Paper levels (empty, low, full)
  - Toner/ink levels
  - Paper jams
  - Door/cover status
  - Error detection and classification
- **Supply Management**: Track consumables and alert on low levels
- **Queue Management**: Per-printer queue with priority support
- **Maintenance Mode**: Take printers offline for service
- **Compatibility Checking**: Validate print settings vs printer capabilities

### 📋 Print Job System

- **Job Lifecycle Management**: Submit → Queue → Process → Complete
- **Priority Queuing**: Staff jobs prioritized over student jobs
- **Status Tracking**: Pending, queued, in-progress, completed, failed, cancelled
- **Cost Calculation**: Automatic pricing based on configurable rates
- **Job History**: Complete audit trail with timestamps
- **Batch Operations**: Bulk job management for admins
- **Reprint Support**: Easy job resubmission
- **Cancellation**: User and admin cancellation capabilities

### 💳 Payment Integration

- **Multiple Payment Methods**:
  - Online Payment (Razorpay)
  - Cash Payment (offline with admin approval)
- **Payment Workflows**:
  - Instant approval for online payments
  - Approval queue for cash payments
- **Transaction Records**: Complete payment history
- **Refund Support**: Automated refunds for failed jobs
- **Revenue Tracking**: Daily, weekly, monthly reports

### 🔔 Notification System

- **Database Notifications**: Persistent notification storage
- **Real-time Alerts**: Socket.IO for instant delivery
- **Email Notifications**: SMTP integration with HTML templates
- **Notification Types**:
  - Job completed
  - Job failed
  - Printer errors
  - Payment confirmations
  - Query responses
  - System alerts
- **Priority Levels**: Low, medium, high, urgent
- **Read/Unread Tracking**: Mark notifications as read
- **Auto Cleanup**: Remove old notifications

### 📊 Admin Features

- **Dashboard Analytics**: System-wide statistics and metrics
- **User Management**: Create, update, delete users
- **Printer Configuration**: Add, edit, remove printers
- **Pricing Management**: Configure print costs
- **Cash Payment Approval**: Review and approve offline payments
- **Query Management**: Handle student support tickets
- **Error Logs**: Comprehensive error tracking and viewing
- **Activity Logs**: Audit trail of all admin actions
- **System Health**: Monitor server and database status

### 🔍 SNMP Printer Monitoring

- **Automatic Monitoring**: Scheduled checks every 5 minutes
- **HP LaserJet Support**: Optimized for HP printers (M201/M202 series)
- **Canon & Epson Support**: Compatible with SNMP-enabled models
- **Error Detection**: 8 error types monitored
  - lowPaper, noPaper
  - lowToner, noToner
  - doorOpen, jammed
  - offline, serviceRequested
- **Real-time Alerts**: Admin notifications for critical errors
- **Supply Level Tracking**: Monitor paper and toner levels
- **Status Updates**: Automatic printer status updates

### 📧 Email System

- **Unified Email Service**: Centralized email management
- **SMTP Integration**: Gmail, SendGrid, or custom SMTP
- **HTML Templates**: Beautiful, responsive email designs
- **Plain Text Fallback**: Compatibility with all email clients
- **Query Notifications**: Automated responses to support tickets
- **Status Updates**: Email alerts for job and query status changes
- **Priority-based Sending**: Urgent emails sent immediately

### 🔄 Queue Management

- **Priority-based Ordering**: High priority jobs processed first
- **FIFO within Priority**: Fair processing within same priority level
- **Position Tracking**: Real-time queue position updates
- **Automatic Processing**: Background job processor
- **Failure Recovery**: Automatic retry logic
- **Queue Statistics**: Per-printer queue metrics

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│                    (React Frontend)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS/WSS
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                   Express.js Server                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Middleware Stack                      │  │
│  │  • CORS                • Rate Limiting                   │  │
│  │  • Helmet (Security)   • Body Parser                     │  │
│  │  • Morgan (Logging)    • Error Handler                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Authentication Layer                   │  │
│  │  • Clerk JWT Verification                                │  │
│  │  • Role-based Access Control                             │  │
│  │  • User Session Management                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      API Routes                          │  │
│  │  /api/users              /api/admin                      │  │
│  │  /api/print-jobs         /api/printers                   │  │
│  │  /api/upload             /api/payments                   │  │
│  │  /api/notifications      /api/queries                    │  │
│  │  /api/queue              /api/cash-payment               │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Business Logic Layer                   │  │
│  │  • Controllers  • Services  • Utilities                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Background Services                    │  │
│  │  • Queue Processor  • SNMP Monitor  • Email Service      │  │
│  │  • Cron Scheduler   • Socket.IO Server                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
│   MongoDB    │  │  Cloudinary │  │  Razorpay  │
│   Database   │  │   Storage   │  │  Payments  │
└──────────────┘  └─────────────┘  └────────────┘
        │
┌───────▼──────────────────────────────────────┐
│        Hardware Layer (Printers)             │
│  • HP LaserJet  • Canon  • Epson  • Others  │
│  • SNMP Protocol  • Network Communication    │
└──────────────────────────────────────────────┘
```

### Request Flow

```
1. Client Request → Express Server
2. Middleware Processing (CORS, Auth, Rate Limit)
3. Route Handler → Controller
4. Business Logic Execution
5. Database/External Service Call
6. Response Formation
7. Client Response ← Express Server
8. Real-time Update (Socket.IO) → Connected Clients
```

### Background Processing Flow

```
Cron Schedule (Every 5 minutes)
        ↓
SNMP Monitoring Service
        ↓
Query All Active Network Printers
        ↓
Detect Errors & Update Status
        ↓
Create Notifications (if needed)
        ↓
Emit Socket.IO Events
        ↓
Update Admin Dashboard (Real-time)
```

---

## 🛠️ Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18.0.0+ | JavaScript runtime |
| Express.js | 4.18.2 | Web application framework |
| MongoDB | 8.0.3+ | NoSQL database |
| Mongoose | 8.0.3 | MongoDB ODM |

### Authentication & Security

| Technology | Version | Purpose |
|------------|---------|---------|
| @clerk/clerk-sdk-node | 5.0.0 | Authentication provider |
| @clerk/express | 1.0.0 | Express middleware for Clerk |
| jsonwebtoken | 9.0.2 | JWT token handling |
| bcryptjs | 2.4.3 | Password hashing |
| helmet | 7.1.0 | Security headers |
| express-rate-limit | 7.1.5 | API rate limiting |

### File & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| cloudinary | 1.41.0 | Cloud file storage |
| multer | 1.4.5-lts.1 | Multipart form data handling |
| pdfkit | 0.15.2 | PDF generation (blank separators) |

### Communication & Messaging

| Technology | Version | Purpose |
|------------|---------|---------|
| socket.io | 4.8.1 | Real-time bi-directional communication |
| nodemailer | 6.9.7 | Email sending |
| @emailjs/nodejs | 5.0.2 | EmailJS integration |

### Payment & Webhooks

| Technology | Version | Purpose |
|------------|---------|---------|
| razorpay | 2.9.6 | Payment gateway integration |
| svix | 1.76.1 | Webhook verification |

### Hardware & Monitoring

| Technology | Version | Purpose |
|------------|---------|---------|
| net-snmp | 3.26.0 | SNMP printer monitoring |
| node-cron | 4.2.1 | Scheduled task execution |
| pdf-to-printer | 5.6.1 | Direct printer communication |

### Utilities & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| express-validator | 7.0.1 | Request validation |
| dotenv | 16.3.1 | Environment variable management |
| cors | 2.8.5 | Cross-origin resource sharing |
| morgan | 1.10.0 | HTTP request logging |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| nodemon | 3.0.2 | Auto-restart on file changes |
| jest | 29.7.0 | Testing framework |
| supertest | 6.3.3 | HTTP assertion library |

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 6.0.0 or higher
- **MongoDB** 6.0.0 or higher (local or MongoDB Atlas)
- **Cloudinary Account** (for file storage)
- **Clerk Account** (for authentication)

### Installation Steps

1. **Navigate to server directory**

```bash
cd server
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see Environment Configuration section).

4. **Setup database**

Run the setup script to initialize the database with sample data:

```bash
node setup.js
```

Or reset the database:

```bash
node setup.js --reset
```

5. **Seed printers (optional)**

```bash
node seed-printers.js
```

6. **Start the server**

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

7. **Verify installation**

Server should start on `http://localhost:3001`

Test the API:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-29T...",
  "service": "PrintHub API",
  "version": "1.0.0"
}
```

### Quick Test

Run a comprehensive API test:

```bash
node test.js
```

This will test:
- Database connection
- User endpoints
- Printer endpoints
- Print job endpoints
- File upload endpoints

---

## 🔐 Environment Configuration

### Environment Variables

Create a `.env` file in the `server/` directory with the following configuration:

```env
# ============================================================================
# SERVER CONFIGURATION
# ============================================================================
PORT=3001
NODE_ENV=development  # development | staging | production

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/printhub

# MongoDB Atlas (Production)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/printhub?retryWrites=true&w=majority

# ============================================================================
# CLERK AUTHENTICATION
# ============================================================================
# Get your keys from: https://dashboard.clerk.com
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Webhook secret for Clerk events (optional)
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# ============================================================================
# CLOUDINARY CONFIGURATION
# ============================================================================
# Get your credentials from: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=printhub_uploads

# ============================================================================
# SECURITY
# ============================================================================
# Generate a strong secret key for JWT signing
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# CORS allowed origins (comma-separated)
CORS_ORIGIN=http://localhost:5173,http://localhost:8080

# ============================================================================
# FILE UPLOAD LIMITS
# ============================================================================
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,xls,xlsx,ppt,pptx,jpg,jpeg,png

# ============================================================================
# EMAIL CONFIGURATION (Gmail SMTP)
# ============================================================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false  # true for port 465, false for other ports
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password

# EmailJS (Alternative)
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_TEMPLATE_ID=template_xxxxx
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key

# ============================================================================
# PAYMENT GATEWAY (Razorpay)
# ============================================================================
# Get your keys from: https://dashboard.razorpay.com
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key

# ============================================================================
# SNMP CONFIGURATION
# ============================================================================
SNMP_COMMUNITY=public
SNMP_TIMEOUT=5000  # milliseconds
SNMP_RETRIES=2
SNMP_MONITORING_INTERVAL=5  # minutes

# ============================================================================
# RATE LIMITING
# ============================================================================
API_RATE_LIMIT_WINDOW=15  # minutes
API_RATE_LIMIT_MAX=100  # requests per window

# ============================================================================
# SOCKET.IO
# ============================================================================
SOCKET_IO_CORS_ORIGIN=http://localhost:5173

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=info  # error | warn | info | http | verbose | debug
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| **Server** ||||
| `PORT` | ❌ | 3001 | Server port |
| `NODE_ENV` | ❌ | development | Environment mode |
| **Database** ||||
| `MONGODB_URI` | ✅ | - | MongoDB connection string |
| **Authentication** ||||
| `CLERK_PUBLISHABLE_KEY` | ✅ | - | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ | - | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | ❌ | - | Webhook verification secret |
| `JWT_SECRET` | ✅ | - | JWT signing secret |
| **Storage** ||||
| `CLOUDINARY_CLOUD_NAME` | ✅ | - | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | - | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | - | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_PRESET` | ✅ | - | Upload preset name |
| **Email** ||||
| `EMAIL_HOST` | ✅ | smtp.gmail.com | SMTP host |
| `EMAIL_PORT` | ✅ | 587 | SMTP port |
| `EMAIL_USER` | ✅ | - | Email account |
| `EMAIL_APP_PASSWORD` | ✅ | - | App password |
| **Payment** ||||
| `RAZORPAY_KEY_ID` | ✅ | - | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | ✅ | - | Razorpay secret |
| **Security** ||||
| `CORS_ORIGIN` | ❌ | * | CORS origins |
| `API_RATE_LIMIT_MAX` | ❌ | 100 | Rate limit max requests |

### Getting API Keys

#### MongoDB Setup

**Local MongoDB:**
```bash
# Install MongoDB
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb
# Windows: Download from mongodb.com

# Start MongoDB
mongod
```

**MongoDB Atlas (Cloud):**
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Add IP whitelist
5. Create database user

#### Clerk Setup

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Go to API Keys section
4. Copy Publishable Key and Secret Key
5. Configure authentication settings:
   - Enable email/password
   - Configure social logins (optional)
   - Set up webhooks (optional)
6. Add user metadata fields for roles:
   - Go to Users → Metadata
   - Add public metadata field: `role` (string)

#### Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, API Secret
4. Create upload preset:
   - Settings → Upload → Upload Presets
   - Add upload preset
   - Name: `printhub_uploads`
   - Signing Mode: Signed (for security)
   - Folder: `print_jobs`

#### Gmail SMTP Setup

1. Enable 2-factor authentication on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an App Password
4. Use this password in `EMAIL_APP_PASSWORD`
5. Use your Gmail address in `EMAIL_USER`

#### Razorpay Setup

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys
3. Generate Test/Live keys
4. Copy Key ID and Secret
5. Configure webhooks for payment events (optional)

---

## 📚 API Documentation

### API Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

### Authentication

Most endpoints require authentication using Clerk JWT tokens.

**Header:**
```
Authorization: Bearer <clerk_jwt_token>
```

### Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": [ ... ]
  }
}
```

### API Endpoints

#### Health & Status

##### GET /health
Check server health status.

**Authentication:** None

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-29T10:30:00.000Z",
  "service": "PrintHub API",
  "version": "1.0.0"
}
```

##### GET /api
Get API information and available endpoints.

**Authentication:** None

**Response:**
```json
{
  "success": true,
  "message": "PrintHub API",
  "status": "running",
  "version": "1.0.0",
  "endpoints": {
    "users": "/api/users",
    "printJobs": "/api/print-jobs",
    "printers": "/api/printers",
    ...
  }
}
```

---

#### User Endpoints

##### GET /api/users/health
User routes health check.

**Authentication:** None

**Response:**
```json
{
  "success": true,
  "message": "User routes are working",
  "timestamp": "2025-10-29T10:30:00.000Z"
}
```

##### GET /api/users/clerk/:clerkUserId
Get user by Clerk user ID.

**Authentication:** Required

**Parameters:**
- `clerkUserId` (path) - Clerk user ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "clerkUserId": "user_2abc123",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "role": "student",
    "status": "active",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

##### POST /api/users/get-or-create
Get existing user or create if not exists.

**Authentication:** Required

**Request Body:**
```json
{
  "clerkUserId": "user_2abc123",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "created": false
  }
}
```

##### PUT /api/users/clerk/:clerkUserId
Update user profile.

**Authentication:** Required (Own profile or Admin)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { ... }
}
```

##### PUT /api/users/profile
Update current user's profile (alternative endpoint).

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": { ... }
  }
}
```

##### GET /api/users/clerk/:clerkUserId/stats
Get user statistics (print jobs, spending, etc.).

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalJobs": 45,
    "completedJobs": 42,
    "failedJobs": 2,
    "pendingJobs": 1,
    "totalSpent": 250.50,
    "lastPrintJob": "2025-10-25T14:30:00.000Z"
  }
}
```

##### GET /api/users
Get all users (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)
- `role` (optional) - Filter by role (admin, staff, student)
- `status` (optional) - Filter by status (active, suspended)

**Response:**
```json
{
  "success": true,
  "data": [
    { user1 },
    { user2 },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

#### Print Job Endpoints

##### POST /api/print-jobs
Create a new print job.

**Authentication:** Required (Student or Staff only - Admin cannot upload)

**Request Body:**
```json
{
  "clerkUserId": "user_2abc123",
  "printerId": "507f1f77bcf86cd799439011",
  "file": {
    "cloudinaryUrl": "https://res.cloudinary.com/...",
    "publicId": "print_jobs/user_2abc123/document_xyz",
    "originalName": "assignment.pdf",
    "format": "pdf",
    "sizeKB": 1024
  },
  "settings": {
    "pages": "1-5",
    "copies": 2,
    "color": false,
    "duplex": true,
    "paperType": "A4",
    "orientation": "portrait",
    "quality": "normal"
  },
  "cost": {
    "totalCost": 20.50
  },
  "payment": {
    "amount": 20.50,
    "status": "pending",
    "method": "online"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "clerkUserId": "user_2abc123",
    "printerId": "507f1f77bcf86cd799439011",
    "priority": "normal",  // or "high" for staff
    "status": "pending",
    "queue": {
      "position": 5,
      "addedToQueue": true
    },
    "createdAt": "2025-10-29T10:30:00.000Z"
  },
  "message": "Print job created successfully"
}
```

**Error Responses:**
- `403 ADMIN_UPLOAD_FORBIDDEN` - Admin users cannot upload files
- `404 PRINTER_NOT_FOUND` - Printer not found
- `400 PRINTER_UNAVAILABLE` - Printer is offline or in maintenance

##### GET /api/print-jobs/user/:clerkUserId
Get user's print jobs.

**Authentication:** Required (Own jobs or Admin)

**Query Parameters:**
- `status` (optional) - Filter by status
- `page` (optional) - Page number
- `limit` (optional) - Items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "file": {
        "cloudinaryUrl": "...",
        "originalName": "document.pdf"
      },
      "status": "completed",
      "priority": "normal",
      "createdAt": "2025-10-29T10:00:00.000Z"
    },
    ...
  ]
}
```

##### GET /api/print-jobs/:id
Get specific print job details.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "clerkUserId": "user_2abc123",
    "printerId": {
      "_id": "...",
      "name": "HP LaserJet Pro M201",
      "location": "Main Library"
    },
    "file": { ... },
    "settings": { ... },
    "cost": { ... },
    "payment": { ... },
    "status": "completed",
    "priority": "normal",
    "timing": {
      "submitted": "2025-10-29T10:00:00.000Z",
      "started": "2025-10-29T10:05:00.000Z",
      "completed": "2025-10-29T10:08:00.000Z"
    }
  }
}
```

##### PUT /api/print-jobs/:id/cancel
Cancel a print job.

**Authentication:** Required (Job owner or Admin)

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Print job cancelled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "cancelled"
  }
}
```

##### DELETE /api/print-jobs/:id
Delete a print job (Admin only).

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "message": "Print job deleted successfully"
}
```

##### GET /api/print-jobs
Get all print jobs (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `status` (optional) - Filter by status
- `printerId` (optional) - Filter by printer
- `priority` (optional) - Filter by priority
- `page` (optional) - Page number
- `limit` (optional) - Items per page
- `startDate` (optional) - Filter from date
- `endDate` (optional) - Filter to date

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... },
  "stats": {
    "total": 500,
    "pending": 10,
    "completed": 480,
    "failed": 10
  }
}
```

---

#### Printer Endpoints

##### GET /api/printers
Get all printers.

**Authentication:** Required

**Query Parameters:**
- `status` (optional) - Filter by status (online, offline, maintenance)
- `location` (optional) - Filter by location

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "HP LaserJet Pro M201",
      "status": "online",
      "location": "Main Library - Ground Floor",
      "isActive": true,
      "queue": {
        "count": 5,
        "estimatedWait": "15 minutes"
      },
      "supplies": {
        "paperLevel": 80,
        "tonerLevel": 45
      },
      "specifications": {
        "colorSupport": false,
        "duplexSupport": true,
        "supportedPaperTypes": ["A4", "Letter"],
        "maxPrintSpeed": 25
      }
    },
    ...
  ]
}
```

##### GET /api/printers/available
Get available (online) printers only.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [ ... ]
}
```

##### GET /api/printers/:id
Get specific printer details.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "HP LaserJet Pro M201",
    "status": "online",
    "lastChecked": "2025-10-29T10:25:00.000Z",
    "lastKnownErrors": [],
    "systemInfo": {
      "ipAddress": "192.168.1.101",
      "connectionType": "Network",
      "macAddress": "00:11:22:33:44:55",
      "driverName": "HP LaserJet Pro M201-M202 PCL 6"
    },
    "specifications": { ... },
    "settings": {
      "enableBlankPageSeparator": true
    },
    "statistics": {
      "totalJobsPrinted": 1523,
      "totalPagesUsed": 8945
    }
  }
}
```

##### POST /api/printers
Create a new printer (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Canon PIXMA MG3620",
  "location": "Computer Lab B",
  "isActive": true,
  "systemInfo": {
    "ipAddress": "192.168.1.105",
    "connectionType": "Network",
    "driverName": "Canon PIXMA MG3620 series"
  },
  "specifications": {
    "colorSupport": true,
    "duplexSupport": false,
    "supportedPaperTypes": ["A4", "Letter", "4x6"],
    "maxPrintSpeed": 8
  },
  "settings": {
    "enableBlankPageSeparator": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Printer created successfully",
  "data": { ... }
}
```

##### PUT /api/printers/:id
Update printer details (Admin only).

**Authentication:** Required (Admin)

**Request Body:** (partial update supported)
```json
{
  "name": "HP LaserJet Pro M201dw",
  "location": "Main Library - First Floor",
  "status": "online"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Printer updated successfully",
  "data": { ... }
}
```

##### DELETE /api/printers/:id
Delete a printer (Admin only).

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "message": "Printer deleted successfully"
}
```

##### POST /api/printers/:id/maintenance
Set printer maintenance mode (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "maintenance": true,
  "reason": "Scheduled maintenance - replacing toner"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Printer set to maintenance mode",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "maintenance"
  }
}
```

##### GET /api/printers/:id/queue
Get printer queue.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "printerId": "507f1f77bcf86cd799439011",
    "printerName": "HP LaserJet Pro M201",
    "queue": [
      {
        "position": 1,
        "printJobId": {
          "_id": "...",
          "file": {
            "originalName": "document.pdf"
          },
          "priority": "high",
          "settings": {
            "pages": "all",
            "copies": 1
          }
        },
        "status": "pending",
        "estimatedStartTime": "2025-10-29T10:35:00.000Z"
      },
      ...
    ],
    "totalInQueue": 5,
    "estimatedWaitTime": "15 minutes"
  }
}
```

##### GET /api/printers/:id/snmp-status
Get real-time printer status via SNMP.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "maintenance",
    "pageCount": 1245,
    "deviceStatus": "warning",
    "errors": ["doorOpen", "lowPaper"],
    "alertMessage": "Paper level is running low; Printer door or cover is open",
    "hasErrors": true,
    "snmpSupported": true,
    "printerName": "HP LaserJet Pro M201-M202",
    "location": "Main Library - Ground Floor"
  }
}
```

##### POST /api/printers/monitor-all
Manually trigger SNMP monitoring for all printers (Admin only).

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "message": "Printer monitoring started in background"
}
```

##### POST /api/printers/:id/validate-compatibility
Validate print settings compatibility with printer.

**Authentication:** Required

**Request Body:**
```json
{
  "settings": {
    "color": true,
    "duplex": true,
    "paperType": "A4"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "compatible": false,
    "issues": [
      {
        "setting": "color",
        "reason": "Printer does not support color printing"
      }
    ],
    "printerCapabilities": {
      "colorSupport": false,
      "duplexSupport": true,
      "paperSizes": ["A4", "Letter"]
    }
  }
}
```

---

## 🗄️ Database Schema

PrintHub uses MongoDB with Mongoose ODM for data persistence. The database is organized into multiple collections with defined schemas and relationships.

### Collections Overview

| Collection | Purpose | Relationships |
|------------|---------|---------------|
| `users` | User accounts and profiles | → printjobs, cashprintrequests |
| `printjobs` | Print job records | → users, printers, queue |
| `printers` | Printer information | → printjobs, printererrors |
| `queue` | Print queue entries | → printjobs, printers |
| `notifications` | User notifications | → users, printjobs |
| `cashprintrequests` | Cash payment requests | → users, printers |
| `queries` | Support tickets | → users |
| `adminlogs` | Admin activity logs | → users |
| `printererrors` | Printer error logs | → printers |
| `pricingconfigs` | Pricing configuration | - |
| `revenues` | Revenue tracking | - |

### User Schema

```javascript
{
  clerkUserId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  profile: {
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    phone: String,
    avatar: String
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    default: 'student',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    printReminders: { type: Boolean, default: true },
    defaultPrinter: { type: mongoose.Schema.Types.ObjectId, ref: 'Printer' }
  },
  statistics: {
    totalPrintJobs: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastPrintDate: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes:**
- `clerkUserId` (unique)
- `profile.email` (unique)
- `role`
- `status`

### PrintJob Schema

```javascript
{
  clerkUserId: {
    type: String,
    required: true,
    index: true
  },
  printerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer',
    required: true,
    index: true
  },
  file: {
    cloudinaryUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    originalName: { type: String, required: true },
    format: { type: String, required: true },
    sizeKB: { type: Number, required: true }
  },
  settings: {
    pages: { type: String, default: 'all' },
    copies: { type: Number, default: 1, min: 1, max: 100 },
    color: { type: Boolean, default: false },
    duplex: { type: Boolean, default: false },
    paperType: { 
      type: String, 
      enum: ['A4', 'Letter', 'Legal', 'A3', '4x6'], 
      default: 'A4' 
    },
    orientation: { 
      type: String, 
      enum: ['portrait', 'landscape'], 
      default: 'portrait' 
    },
    quality: { 
      type: String, 
      enum: ['draft', 'normal', 'high'], 
      default: 'normal' 
    },
    status: {
      type: String,
      enum: ['pending', 'queued', 'in-progress', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    }
  },
  priority: {
    type: String,
    enum: ['normal', 'high'],
    default: 'normal',
    index: true
  },
  cost: {
    baseCost: Number,
    colorCost: Number,
    duplexDiscount: Number,
    totalCost: { type: Number, required: true }
  },
  payment: {
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'], 
      default: 'pending' 
    },
    method: { 
      type: String, 
      enum: ['online', 'cash'], 
      default: 'online' 
    },
    transactionId: String,
    paidAt: Date,
    refundedAt: Date
  },
  timing: {
    submitted: { type: Date, default: Date.now },
    queued: Date,
    started: Date,
    completed: Date,
    cancelled: Date
  },
  errorDetails: {
    message: String,
    code: String,
    timestamp: Date
  },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes:**
- `clerkUserId`
- `printerId`
- `settings.status`
- `priority` (descending) + `createdAt` (ascending) - Compound index for queue
- `createdAt`

### Printer Schema

```javascript
{
  name: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'busy'],
    default: 'offline',
    index: true
  },
  location: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastChecked: Date,
  lastKnownErrors: [String],
  systemInfo: {
    ipAddress: String,
    connectionType: { 
      type: String, 
      enum: ['Network', 'USB', 'Virtual'], 
      default: 'Network' 
    },
    macAddress: String,
    driverName: String
  },
  supplies: {
    paperLevel: { type: Number, min: 0, max: 100, default: 100 },
    tonerLevel: { type: Number, min: 0, max: 100, default: 100 },
    inkLevels: {
      black: { type: Number, min: 0, max: 100 },
      cyan: { type: Number, min: 0, max: 100 },
      magenta: { type: Number, min: 0, max: 100 },
      yellow: { type: Number, min: 0, max: 100 }
    }
  },
  specifications: {
    colorSupport: { type: Boolean, default: false },
    duplexSupport: { type: Boolean, default: false },
    supportedPaperTypes: [String],
    maxPrintSpeed: Number,
    maxResolution: String
  },
  settings: {
    enableBlankPageSeparator: { 
      type: Boolean, 
      default: true,
      description: 'Print blank page between jobs'
    }
  },
  pricing: {
    blackAndWhite: { type: Number, default: 2 },
    color: { type: Number, default: 5 }
  },
  statistics: {
    totalJobsPrinted: { type: Number, default: 0 },
    totalPagesUsed: { type: Number, default: 0 },
    lastPrintJob: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes:**
- `name` (unique)
- `status`
- `isActive`

### Queue Schema

```javascript
{
  printJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintJob',
    required: true,
    unique: true
  },
  printerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer',
    required: true,
    index: true
  },
  position: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  addedAt: { type: Date, default: Date.now },
  startedAt: Date,
  completedAt: Date
}
```

**Indexes:**
- `printJobId` (unique)
- `printerId`
- `status`
- `printerId` + `position` - Compound index for queue ordering

### CashPrintRequest Schema

```javascript
{
  clerkUserId: {
    type: String,
    required: true,
    index: true
  },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  printerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer',
    required: true
  },
  file: {
    cloudinaryUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    originalName: { type: String, required: true },
    format: { type: String, required: true },
    sizeKB: { type: Number, required: true }
  },
  settings: {
    pages: { type: String, default: 'all' },
    copies: { type: Number, default: 1 },
    color: { type: Boolean, default: false },
    duplex: { type: Boolean, default: false },
    paperType: { type: String, default: 'A4' }
  },
  cost: {
    totalCost: { type: Number, required: true }
  },
  payment: {
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'cancelled'], 
      default: 'pending' 
    },
    method: { type: String, default: 'cash' }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  timing: {
    submittedAt: { type: Date, default: Date.now },
    updatedAt: Date,
    completedAt: Date
  },
  adminNotes: String,
  rejectionReason: String,
  approvedBy: String,
  createdAt: { type: Date, default: Date.now }
}
```

### Notification Schema

```javascript
{
  clerkUserId: {
    type: String,
    required: true,
    index: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrintJob'
  },
  type: {
    type: String,
    enum: [
      'job_completed', 'job_failed', 'reprint', 
      'queue_update', 'maintenance', 'system', 
      'payment', 'new_print_job', 'job_submitted'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    printerId: mongoose.Schema.Types.ObjectId,
    errorCode: String,
    actionRequired: Boolean,
    originalError: String,
    affectedUser: String
  },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes:**
- `clerkUserId`
- `type`
- `read`
- `priority`
- `createdAt`

### Query Schema (Support Tickets)

```javascript
{
  studentId: {
    type: String,
    required: true,
    index: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Printing Issues', 'Payment & Billing', 'Account Settings', 'General'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  adminResponse: String,
  respondedBy: String,
  respondedAt: Date,
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}
```

### AdminLog Schema

```javascript
{
  adminId: {
    type: String,
    required: true,
    index: true
  },
  adminName: String,
  action: {
    type: String,
    enum: [
      'reprint', 'cancel_job', 'printer_maintenance',
      'user_action', 'system_config', 'user_suspend',
      'user_activate', 'printer_add', 'printer_remove',
      'printer_update', 'bulk_action', 'data_export',
      'settings_update'
    ],
    required: true,
    index: true
  },
  targetType: {
    type: String,
    enum: ['user', 'printer', 'print_job', 'system']
  },
  targetId: String,
  details: {
    description: String,
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    affectedRecords: Number
  },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now, index: true }
}
```

### PricingConfig Schema

```javascript
{
  name: {
    type: String,
    default: 'Default Pricing',
    unique: true
  },
  rates: {
    blackAndWhite: {
      perPage: { type: Number, required: true, min: 0 },
      duplexDiscount: { type: Number, default: 0, min: 0, max: 100 }
    },
    color: {
      perPage: { type: Number, required: true, min: 0 },
      duplexDiscount: { type: Number, default: 0, min: 0, max: 100 }
    }
  },
  paperSizes: {
    A4: { type: Number, default: 0, min: 0 },
    Letter: { type: Number, default: 0, min: 0 },
    Legal: { type: Number, default: 0, min: 0 },
    A3: { type: Number, default: 0, min: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveFrom: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### Database Relationships

```
users (1) ──────> (*) printjobs
users (1) ──────> (*) cashprintrequests
users (1) ──────> (*) notifications
users (1) ──────> (*) queries
users (1) ──────> (*) adminlogs

printers (1) ───> (*) printjobs
printers (1) ───> (*) queue
printers (1) ───> (*) printererrors
printers (1) ───> (*) cashprintrequests

printjobs (1) ──> (1) queue
printjobs (1) ──> (*) notifications
```

---

## 🔧 Services & Utilities

### Core Services

#### Queue Manager (`services/queueManager.js`)

Manages the print job queue with priority-based ordering.

**Key Functions:**
- `enqueue(printJobId)` - Add job to queue with priority positioning
- `getNextJob()` - Get next job to process (respects priority)
- `completeJob(printJobId)` - Mark job as completed and remove from queue
- `failJob(printJobId, error)` - Mark job as failed with error details
- `getQueue
