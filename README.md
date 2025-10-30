# 🖨️ PrintHub - Enterprise Printing Management System

A comprehensive full-stack application for managing print jobs in educational institutions and enterprise environments, featuring real-time monitoring, intelligent queuing, and advanced hardware integration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Features Documentation](#-features-documentation)
- [Environment Configuration](#-environment-configuration)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

PrintHub is an enterprise-grade printing management platform designed to streamline print operations in educational institutions, libraries, and corporate environments. It provides end-to-end management of print jobs, from file upload to physical printing, with real-time monitoring, intelligent queue management, and comprehensive analytics.

### Why PrintHub?

- **🚀 Modern Stack**: Built with latest React 18, TypeScript, and Vite for blazing-fast performance
- **🔐 Secure**: Clerk authentication with role-based access control
- **📊 Real-time**: Socket.IO integration for live updates and notifications
- **🖨️ Hardware Integration**: SNMP monitoring for HP, Canon, Epson printers
- **💳 Payment Ready**: Integrated Razorpay for online payments and cash payment workflow
- **📱 Responsive**: Mobile-first design with PWA capabilities
- **🎨 Beautiful UI**: 40+ shadcn/ui components with dark/light theme support

---

## ✨ Key Features

### For Students/Users

#### 📤 File Upload & Management
- **Multi-format Support**: PDF, DOC, DOCX, PPT, PPTX, images (JPG, PNG)
- **Drag & Drop Interface**: Intuitive file upload with progress tracking
- **Cloudinary Integration**: Secure cloud storage with CDN delivery
- **File Preview**: Built-in PDF viewer with page navigation
- **Batch Upload**: Upload multiple files simultaneously
- **File Validation**: Automatic format and size checking (max 10MB)

#### ⚙️ Print Configuration
- **Flexible Settings**:
  - Page selection (all, range, or specific pages)
  - Copies (1-100)
  - Color/Black & White
  - Duplex (single/double-sided)
  - Paper size (A4, Letter, Legal, A3)
  - Orientation (Portrait/Landscape)
  - Quality (Draft, Normal, High)
- **Cost Calculator**: Real-time price estimation before printing
- **Print Profiles**: Save and reuse common configurations
- **Advanced Options**: Margins, scaling, collation

#### 🖨️ Printer Selection
- **Live Status**: Real-time printer availability and status
- **Smart Filters**: Filter by location, capabilities, or status
- **Printer Details**: View specifications, supply levels, and queue length
- **Compatibility Check**: Automatic validation of printer capabilities vs print settings

#### 💳 Payment System
- **Multiple Payment Methods**:
  - Online Payment (Razorpay)
  - Cash Payment (requires admin approval)
  - Wallet/Credits (future)
- **Secure Processing**: PCI-compliant payment gateway
- **Payment History**: View all transactions
- **Refund Support**: Automated refund for failed jobs

#### 📊 Dashboard & Tracking
- **Personal Dashboard**: Overview of all print jobs
- **Job History**: Complete record with filters (pending, completed, failed)
- **Real-time Notifications**: In-app and email alerts
- **Print Statistics**: Usage analytics and cost tracking
- **Queue Position**: Live updates on job status

### For Staff Members

#### 🎯 Priority Upload System
- **High Priority Queue**: Staff uploads automatically prioritized
- **Fast Processing**: Staff jobs processed before student jobs
- **Backend Priority Logic**: Server-side enforcement (cannot be bypassed)
- **Transparent**: No UI changes needed, seamless experience

### For Administrators

#### 🎛️ Admin Dashboard
- **System Overview**: Real-time statistics and metrics
  - Active users count
  - Total print jobs (today, week, month)
  - Revenue tracking
  - Printer utilization
- **Interactive Charts**: Revenue trends, job distribution, printer usage
- **Quick Actions**: Common administrative tasks
- **System Health**: Server status, database connection, service health

#### 🖨️ Printer Management
- **Printer CRUD**: Add, edit, delete, and configure printers
- **SNMP Monitoring**: Automatic hardware status detection
  - Paper jams
  - Low toner/ink
  - Paper levels
  - Door open alerts
  - Offline detection
- **Maintenance Mode**: Take printers offline for service
- **Supply Management**: Track toner, ink, and paper levels
- **Queue Management**: View and manage printer queues
- **Error Handling**: Automatic detection and notification of hardware issues

#### 👥 User Management
- **User CRUD**: Create, view, update users
- **Role Assignment**: Student, Staff, Admin roles
- **Staff Creation**: Create staff accounts with priority upload
- **Activity Logs**: Track user actions and print history
- **Account Status**: Activate/suspend user accounts

#### 💰 Financial Management
- **Cash Payment Approval**: Review and approve cash payment requests
  - Pending requests dashboard
  - Approve/Reject workflow
  - Admin notes and reasons
- **Pricing Configuration**: Update print pricing
  - Per-page rates (B&W, Color)
  - Paper size pricing
  - Duplex discounts
- **Revenue Reports**: Daily, weekly, monthly revenue
- **Transaction History**: Complete payment records

#### 📩 Support System
- **Query Management**: Handle student support tickets
  - View all queries with filtering (status, priority, category)
  - Search by student name, email, or subject
  - Update status and priority
  - Add admin responses
  - Email notifications to students
- **Email Notifications**: Automatic email alerts for query updates
  - Confirmation on submission
  - Status change notifications
  - Resolution alerts
- **Statistics Dashboard**: Query metrics and response times

#### 📋 Error Logs & Monitoring
- **Print Error Tracking**: Comprehensive error logging
  - Communication failures
  - Hardware errors
  - File access issues
  - Settings incompatibilities
- **SNMP Integration**: Real-time hardware monitoring
- **Admin Alerts**: Urgent notifications for critical issues
- **Error Classification**: Automatic categorization and prioritization

#### 🔔 Notification System
- **System Notifications**: Printer errors, maintenance alerts
- **Real-time Updates**: Socket.IO for instant notifications
- **Email Alerts**: Configurable email notifications
- **Notification Center**: View all system and user notifications

### Advanced Features

#### � Real-Time Browser Notifications
- **Socket.IO Integration**: Real-time event-driven notifications
- **Web Notifications API**: Native browser notifications with permission management
- **Event Types**: 
  - Print job completed (only after printer confirms completion)
  - Print job failed (on printer errors)
  - Print job terminated (after termination completes with refund)
  - Cash payment approved (when admin approves payment)
- **Dual Notifications**: Browser notification + in-app toast
- **Click Handlers**: Navigate to relevant pages on notification click
- **Connection Management**: Auto-reconnection with exponential backoff
- **User-specific Rooms**: Targeted notifications using userId rooms
- **Permission Prompt**: User-friendly permission request component

**Technical Details**:
- **Backend**: Socket.IO server with room-based messaging
- **Frontend**: React hooks (`useSocketNotifications`, `useBrowserNotifications`)
- **Transports**: WebSocket + polling fallback
- **Reconnection**: 1s-5s exponential backoff, max 5 attempts
- **Security**: User isolation via room names

#### 💰 Dynamic Pricing System
- **Admin-Configurable**: Real-time pricing management from admin panel
- **Base Rates**: Separate rates for B&W and Color printing
- **Paper Surcharges**: Different pricing for A3, A4, Letter, Legal, Certificate
- **Duplex Discount**: Configurable percentage discount for double-sided printing
- **Real-time Updates**: Changes immediately reflected in student pages (5-min cache)
- **Cost Breakdown**: Itemized display of base cost, paper cost, and discounts
- **API Integration**: Centralized pricing logic via `usePricing` hook
- **Cache Management**: 5-minute client-side cache to reduce API load
- **Default Fallback**: Uses default pricing if API fails

**Configuration**:
- Navigate to Admin → Pricing to update rates
- Changes apply to all new print job calculations
- Student pages show dynamic pricing in real-time

#### �🔄 Blank Page Separator
- **Automatic Separation**: Insert blank page between different users' jobs
- **Smart Logic**: Only prints if another job is queued
- **Configurable**: Enable/disable per printer
- **Non-blocking**: Errors don't affect main job processing

#### 📱 Mobile Support
- **Responsive Design**: Works on all devices
- **Touch-friendly**: Optimized for mobile interaction
- **Mobile Components**: Dedicated mobile drawer and sheet components

#### 🌐 Ngrok Support
- **Remote Access**: Built-in ngrok integration for development
- **Header Bypass**: Automatic ngrok warning bypass
- **Easy Testing**: Test from any device on any network

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Student   │  │     Staff    │  │      Admin      │   │
│  │  Dashboard  │  │   Dashboard  │  │    Dashboard    │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│         │                 │                    │            │
│         └─────────────────┼────────────────────┘            │
│                           │                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │        React Router + Protected Routes (Clerk)       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/WSS
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Server Layer (Node.js)                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         Express.js + Socket.IO + Middlewares         │ │
│  └───────────────────────────────────────────────────────┘ │
│                            │                                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │
│  │  Auth    │  Upload  │  Print   │  Payment │  Admin   │ │
│  │  Routes  │  Routes  │  Routes  │  Routes  │  Routes  │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘ │
│                            │                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Queue Manager + SNMP Monitor + Email Service        │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────────────┐  ┌────────────────┐  ┌──────────────┐
│   MongoDB     │  │   Cloudinary   │  │   Razorpay   │
│   Database    │  │   File Storage │  │   Payments   │
└───────────────┘  └────────────────┘  └──────────────┘
        │
┌───────────────────────────────────────┐
│    Hardware Layer (Printers)          │
│    ┌────────┐  ┌────────┐            │
│    │   HP   │  │ Canon  │  + SNMP    │
│    └────────┘  └────────┘            │
└───────────────────────────────────────┘
```

### Data Flow

#### Print Job Lifecycle

```
1. File Upload → Cloudinary Storage
2. Print Configuration → Validation
3. Printer Selection → Compatibility Check
4. Payment Processing → Payment Gateway
5. Job Creation → MongoDB
6. Queue Insertion → Priority-based Positioning
7. Job Processing → Queue Manager
8. Print Execution → Physical Printer
9. Status Update → Real-time Notification
10. Job Completion → History & Analytics
```

---

## 🛠️ Technology Stack

### Frontend Core

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool & dev server |
| React Router | 6.30.1 | Client-side routing |

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 3.4.17 | Utility-first CSS |
| shadcn/ui | Latest | Component library (40+ components) |
| Radix UI | Latest | Accessible primitives |
| Lucide React | 0.462.0 | Icon library (1000+ icons) |
| next-themes | 0.4.6 | Dark/light mode |

### State & Data Management

| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack Query | 5.83.0 | Server state management |
| React Hook Form | 7.61.1 | Form management |
| Zod | 3.25.76 | Schema validation |
| Axios | 1.12.2 | HTTP client |

### Authentication & Real-time

| Technology | Version | Purpose |
|------------|---------|---------|
| Clerk | 5.42.1 | Authentication & user management |
| Socket.IO Client | 4.8.1 | Real-time bi-directional communication |

### File Handling

| Technology | Version | Purpose |
|------------|---------|---------|
| pdfjs-dist | 5.4.149 | PDF rendering & preview |
| Mammoth | 1.11.0 | DOCX to HTML conversion |
| XLSX | 0.18.5 | Excel file handling |

### Additional Libraries

- **date-fns** (3.6.0): Date manipulation and formatting
- **Recharts** (2.15.4): Data visualization & charts
- **Sonner** (1.7.4): Toast notifications
- **class-variance-authority**: Component variants
- **clsx** + **tailwind-merge**: Conditional className utility

### Development Tools

- **ESLint** + **TypeScript ESLint**: Code linting
- **Autoprefixer**: CSS vendor prefixes
- **Vite Plugin React SWC**: Fast React refresh
- **PostCSS**: CSS processing

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** or **bun**
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Cloudinary Account** ([Sign up](https://cloudinary.com/))
- **Clerk Account** ([Sign up](https://clerk.com/))

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/PrintHub.git
cd PrintHub
```

2. **Install frontend dependencies**

```bash
npm install
```

3. **Install backend dependencies**

```bash
cd server
npm install
cd ..
```

4. **Configure environment variables**

Create `.env` in the root directory:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Create `.env` in the `server/` directory (see Backend README for details).

5. **Start the backend server**

```bash
cd server
npm run dev
```

Server will start on `http://localhost:3001`

6. **Start the frontend development server**

In a new terminal:

```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

7. **Access the application**

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **API Health**: http://localhost:3001/health

### First-Time Setup

1. **Create Admin Account**: Sign up through Clerk and assign admin role
2. **Add Printers**: Navigate to Admin → Printers → Add Printer
3. **Configure Pricing**: Admin → Settings → Pricing Configuration
4. **Test Upload**: Upload a test document as a student

---

## 📁 Project Structure

```
PrintHub/
├── 📁 public/                          # Static assets
│   ├── pdf.worker.min.mjs             # PDF.js web worker
│   ├── placeholder.svg                # Placeholder image
│   └── ...
├── 📁 src/                             # Source code
│   ├── 📁 components/                  # React components
│   │   ├── 📁 admin/                  # Admin-specific components
│   │   │   ├── AdminStats.tsx         # Statistics cards
│   │   │   ├── PendingJobs.tsx        # Pending jobs table
│   │   │   ├── RecentActivity.tsx     # Activity feed
│   │   │   └── ...
│   │   ├── 📁 auth/                   # Authentication components
│   │   │   ├── ProtectedRoute.tsx     # Route protection HOC
│   │   │   └── SignIn.tsx             # Sign-in component
│   │   ├── 📁 debug/                  # Debug utilities
│   │   │   └── AuthTestComponent.tsx  # Auth debugging
│   │   ├── 📁 layout/                 # Layout components
│   │   │   ├── AppSidebar.tsx         # Main sidebar navigation
│   │   │   ├── AdminHeader.tsx        # Admin header with navigation
│   │   │   ├── StudentHeader.tsx      # Student header
│   │   │   ├── MobileNav.tsx          # Mobile navigation
│   │   │   └── Footer.tsx             # Footer component
│   │   ├── 📁 mobile/                 # Mobile-specific components
│   │   │   ├── MobileDrawer.tsx       # Mobile drawer
│   │   │   └── MobileSheet.tsx        # Mobile bottom sheet
│   │   ├── 📁 sections/               # Landing page sections
│   │   │   ├── Hero.tsx               # Hero section
│   │   │   ├── Features.tsx           # Features showcase
│   │   │   ├── HowItWorks.tsx         # Process explanation
│   │   │   ├── Pricing.tsx            # Pricing section
│   │   │   └── ContactSection.tsx     # Contact form
│   │   ├── 📁 ui/                     # shadcn/ui components (40+)
│   │   │   ├── button.tsx             # Button component
│   │   │   ├── card.tsx               # Card component
│   │   │   ├── dialog.tsx             # Dialog/Modal
│   │   │   ├── input.tsx              # Input field
│   │   │   ├── select.tsx             # Select dropdown
│   │   │   ├── table.tsx              # Table component
│   │   │   ├── toast.tsx              # Toast notifications
│   │   │   └── ...                    # 30+ more components
│   │   ├── 📁 upload/                 # File upload components
│   │   │   ├── FileUpload.tsx         # Main upload component
│   │   │   ├── UploadProgress.tsx     # Progress indicator
│   │   │   └── FileList.tsx           # Uploaded files list
│   │   ├── AdminCompletionNotification.tsx
│   │   ├── FilePreview.tsx            # PDF/Document preview
│   │   ├── PaymentComponent.tsx       # Payment processing
│   │   ├── PrinterCompatibilityAlert.tsx
│   │   ├── RefundStatus.tsx           # Refund status display
│   │   ├── RoleBasedDashboard.tsx     # Role-based dashboard router
│   │   └── SpecialPaperAlert.tsx      # Special paper type alerts
│   ├── 📁 context/                    # React Context providers
│   │   ├── PrintJobContext.tsx        # Print job state management
│   │   ├── PrintJobFlowContext.tsx    # Print flow state
│   │   └── UploadContext.tsx          # Upload state management
│   ├── 📁 hooks/                      # Custom React hooks
│   │   ├── use-mobile.tsx             # Mobile detection hook
│   │   ├── use-toast.ts               # Toast notification hook
│   │   ├── useAdminCompletionNotifications.ts
│   │   ├── useBackendUpload.ts        # Backend file upload
│   │   ├── useCloudinarySignedUpload.ts
│   │   ├── useCloudinaryUpload.ts     # Cloudinary integration
│   │   ├── useDatabase.ts             # Database operations
│   │   ├── usePayment.ts              # Payment processing
│   │   ├── usePricing.ts              # Pricing calculations
│   │   └── ...
│   ├── 📁 lib/                        # Utility libraries
│   │   ├── apiClient.ts               # Axios instance with interceptors
│   │   ├── utils.ts                   # Utility functions (cn, etc.)
│   │   └── ...
│   ├── 📁 pages/                      # Application pages
│   │   ├── 📁 admin/                  # Admin pages
│   │   │   ├── AdminDashboard.tsx     # Main admin dashboard
│   │   │   ├── CashPayments.tsx       # Cash payment management
│   │   │   ├── ErrorLogs.tsx          # Error log viewer
│   │   │   ├── Printers.tsx           # Printer management
│   │   │   ├── Queries.tsx            # Support query management
│   │   │   ├── Settings.tsx           # Admin settings
│   │   │   └── Users.tsx              # User management
│   │   ├── 📁 features/               # Feature pages
│   │   │   └── ...
│   │   ├── 📁 shared/                 # Shared pages
│   │   │   ├── Support.tsx            # Support/Help page
│   │   │   └── ...
│   │   ├── 📁 student/                # Student pages
│   │   │   ├── History.tsx            # Print history
│   │   │   ├── Payment.tsx            # Payment page
│   │   │   ├── PrintSettings.tsx      # Print configuration
│   │   │   ├── Queue.tsx              # Queue status
│   │   │   ├── SelectPrinter.tsx      # Printer selection
│   │   │   ├── StudentDashboard.tsx   # Main student dashboard
│   │   │   ├── Upload.tsx             # File upload page
│   │   │   └── UserSettings.tsx       # User profile settings
│   │   ├── AuthTestPage.tsx           # Auth testing (dev)
│   │   └── Index.tsx                  # Landing page
│   ├── 📁 router/                     # Routing configuration
│   │   └── index.tsx                  # Route definitions
│   ├── 📁 services/                   # API service layer
│   │   ├── api.ts                     # API client
│   │   └── ...
│   ├── 📁 types/                      # TypeScript type definitions
│   │   ├── index.ts                   # Shared types
│   │   ├── printer.ts                 # Printer types
│   │   ├── printJob.ts                # Print job types
│   │   └── ...
│   ├── 📁 utils/                      # Utility functions
│   │   └── ...
│   ├── App.tsx                        # Main app component
│   ├── main.tsx                       # App entry point
│   ├── App.css                        # Global app styles
│   ├── index.css                      # Global base styles
│   └── vite-env.d.ts                  # Vite type declarations
├── 📁 server/                         # Backend server (see server/README.md)
├── 📄 .env.example                    # Environment variables template
├── 📄 .eslintrc.json                  # ESLint configuration
├── 📄 .gitignore                      # Git ignore rules
├── 📄 components.json                 # shadcn/ui configuration
├── 📄 index.html                      # HTML entry point
├── 📄 package.json                    # Dependencies & scripts
├── 📄 postcss.config.js               # PostCSS configuration
├── 📄 README.md                       # This file
├── 📄 tailwind.config.ts              # Tailwind CSS configuration
├── 📄 tsconfig.json                   # TypeScript configuration
├── 📄 tsconfig.app.json               # App-specific TS config
├── 📄 tsconfig.node.json              # Node-specific TS config
├── 📄 vite.config.ts                  # Vite configuration
└── 📄 vercel.json                     # Vercel deployment config
```

### Key Directories Explained

- **`src/components/ui/`**: Contains 40+ reusable shadcn/ui components (buttons, forms, dialogs, etc.)
- **`src/pages/`**: Page components organized by role (admin, student, shared)
- **`src/hooks/`**: Custom React hooks for common functionality
- **`src/context/`**: React Context providers for global state
- **`src/lib/`**: Utility functions and configurations
- **`server/`**: Complete backend application (see `server/README.md`)

---

## 📚 Features Documentation

### 1. SNMP Printer Monitoring

**Purpose**: Real-time hardware monitoring of network printers using SNMP protocol.

**Supported Printers**: HP LaserJet Pro M201/M202, Canon, Epson (SNMP-enabled)

**Monitored Parameters**:
- Paper status (empty, low, full)
- Toner/ink levels
- Paper jams
- Door/cover status
- Offline detection
- Service requests

**How It Works**:
1. Backend queries printer every 5 minutes via SNMP
2. Decodes 8-bit error status byte
3. Updates printer status in database
4. Creates admin notifications for new errors
5. Emits Socket.IO events to admin dashboard

**Configuration**: See `server/SNMP_MONITORING_README.md`

### 2. Staff Priority Upload System

**Purpose**: Staff uploads are automatically prioritized in the print queue.

**Features**:
- Backend-enforced priority (cannot be bypassed)
- Staff jobs processed before student jobs
- Transparent to staff (no UI changes)
- Automatic priority assignment based on Clerk role
- Admin users cannot upload (role restriction)

**Implementation**:
- Priority field in PrintJob model (`high` | `normal`)
- Queue Manager inserts high priority jobs at front
- All queries sort by priority first, then creation time

**Configuration**: See `STAFF_PRIORITY_UPLOAD.md`

### 3. Cash Payment System

**Purpose**: Offline payment workflow with admin approval.

**Student Flow**:
1. Upload file and configure print settings
2. Select "Cash Payment" option
3. Submit payment request (job in pending state)
4. Pay at physical counter
5. Wait for admin approval

**Admin Flow**:
1. View pending cash payment requests
2. Verify payment received
3. Approve request (creates print job automatically)
4. OR reject request with reason

**Features**:
- Separate database collection for pending requests
- Admin dashboard with filtering
- Statistics (pending count, total amount)
- Approval/rejection with notes
- Automatic print job creation on approval

**Configuration**: See `CASH_PAYMENT_SYSTEM.md`

### 4. Blank Page Separator

**Purpose**: Automatically insert blank page between different users' print jobs.

**Features**:
- Prints only if another job is queued
- Configurable per printer (enable/disable)
- Non-blocking (errors don't affect main workflow)
- Uses PDFKit to generate blank PDF
- Automatic temp file cleanup

**Configuration**:
```javascript
// In printer settings
enableBlankPageSeparator: true  // or false
```

**See**: `BLANK_PAGE_SEPARATOR.md`

### 5. Email Notification System

**Purpose**: Automated email notifications for query updates and job status.

**Triggers**:
- Student submits support query → Confirmation email
- Admin updates query status → Update email
- Admin adds response → Response email
- Query resolved/closed → Resolution email

**Email Service**: Gmail SMTP via Nodemailer

**Features**:
- Beautiful HTML templates
- Plain text fallback
- Color-coded status badges
- Priority indicators
- Direct links to support portal

**Configuration**: See `EMAIL_NOTIFICATIONS_IMPLEMENTATION.md`

### 6. Print Error Handling

**Purpose**: Comprehensive error detection, classification, and notification.

**Error Types**:
- Communication failure (printer offline)
- Hardware error (jam, no paper, no toner)
- Printer not found
- File access error
- Settings incompatibility
- Unknown errors

**Features**:
- Pre-flight health check before printing
- Automatic SNMP monitoring trigger for hardware errors
- User-friendly error messages
- Admin alerts for critical issues
- Real-time Socket.IO notifications
- Detailed error logging

**Configuration**: See `PRINT_ERROR_HANDLING_GUIDE.md`

### 7. Support Query System

**Purpose**: Student support ticket management.

**Student Features**:
- Submit queries with category selection
- Subject and detailed message
- View own queries (My Tickets)
- Email notifications on updates

**Admin Features**:
- View all queries with filtering
- Search by student name, email, subject
- Update status (Open, In Progress, Resolved, Closed)
- Update priority (Low, Medium, High, Urgent)
- Add admin responses
- Email notifications to students
- Statistics dashboard

**Configuration**: See `QUERIES_IMPLEMENTATION.md`

### 8. User Settings

**Purpose**: Allow users to edit their profile information.

**Editable Fields**:
- First Name
- Last Name
- Phone Number

**Read-Only Fields**:
- Email (managed by Clerk)
- Student ID
- Department
- Member Since

**Features**:
- Form validation
- Save to both MongoDB and Clerk
- Success/error notifications
- Beautiful gradient UI

**Configuration**: See `EDITABLE_USER_SETTINGS.md`

---

## 🔐 Environment Configuration

### Frontend Environment Variables

Create a `.env` file in the root directory:

```env
# ============================================================================
# CLERK AUTHENTICATION
# ============================================================================
# Get your keys from: https://dashboard.clerk.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# ============================================================================
# API CONFIGURATION
# ============================================================================
# Backend API base URL
VITE_API_BASE_URL=http://localhost:3001/api

# For production:
# VITE_API_BASE_URL=https://your-api-domain.com/api

# For ngrok (development):
# VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io/api

# ============================================================================
# CLOUDINARY CONFIGURATION
# ============================================================================
# Get your credentials from: https://cloudinary.com/console
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Note: Upload preset must be unsigned for client-side uploads
# Configure at: Cloudinary Console → Settings → Upload → Upload Presets

# ============================================================================
# DEVELOPMENT
# ============================================================================
# Set to true for additional logging
VITE_DEBUG=false

# Set to true to use mock data (no backend required)
VITE_USE_MOCK_DATA=false
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ Yes | Clerk authentication public key |
| `VITE_API_BASE_URL` | ✅ Yes | Backend API base URL |
| `VITE_CLOUDINARY_CLOUD_NAME` | ✅ Yes | Cloudinary cloud name |
| `VITE_CLOUDINARY_API_KEY` | ✅ Yes | Cloudinary API key |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | ✅ Yes | Cloudinary upload preset (unsigned) |

### Getting API Keys

#### Clerk Setup

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the publishable key
4. Configure sign-in/sign-up options
5. Set up user metadata for roles (admin, staff, student)

#### Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Settings
3. Copy Cloud Name and API Key
4. Create an unsigned upload preset:
   - Settings → Upload → Upload Presets
   - Add upload preset → Mode: Unsigned
   - Copy the preset name

---

## 💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Build production bundle |
| `npm run build:dev` | Build development bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

### Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001 (start separately)

Features:
- Hot Module Replacement (HMR)
- Fast Refresh for React components
- TypeScript type checking
- ESLint on save
- Instant feedback on errors

### Building for Production

```bash
npm run build
```

Output: `dist/` directory

The build is optimized and minified:
- Code splitting
- Tree shaking
- Asset optimization
- Source maps (optional)

Preview the production build:

```bash
npm run preview
```

### Code Quality

#### Linting

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint -- --fix
```

#### Type Checking

TypeScript is configured for strict mode. Run type checking:

```bash
npx tsc --noEmit
```

### Adding New Components

#### Using shadcn/ui CLI

```bash
npx shadcn-ui@latest add [component-name]
```

Example:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
```

Available components: https://ui.shadcn.com/docs/components

#### Creating Custom Components

1. Create component file in appropriate directory:
   - `src/components/` for shared components
   - `src/components/admin/` for admin-only
   - `src/components/student/` for student-only

2. Use TypeScript for type safety:

```typescript
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4">
      <h2>{title}</h2>
      <button onClick={onAction}>Click me</button>
    </div>
  );
};
```

3. Export from index file if needed:

```typescript
// src/components/index.ts
export { MyComponent } from './MyComponent';
```

### State Management

#### React Query (TanStack Query)

Used for server state management:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['printers'],
  queryFn: () => apiClient.get('/printers').then(res => res.data)
});

// Mutate data
const mutation = useMutation({
  mutationFn: (newPrinter) => apiClient.post('/printers', newPrinter),
  onSuccess: () => {
    queryClient.invalidateQueries(['printers']);
  }
});
```

#### React Context

Used for local UI state:

```typescript
import { createContext, useContext } from 'react';

const MyContext = createContext(null);

export const MyProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
};

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyContext must be used within MyProvider');
  return context;
};
```

### Routing

Routes are defined in `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

<Routes>
  {/* Public routes */}
  <Route path="/" element={<Index />} />
  
  {/* Student routes */}
  <Route path="/upload" element={
    <ProtectedRoute requiredRole="student">
      <Upload />
    </ProtectedRoute>
  } />
  
  {/* Admin routes */}
  <Route path="/admin/dashboard" element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  } />
</Routes>
```

Protected routes check user authentication and role via Clerk.

### Styling

#### Tailwind CSS

Use Tailwind utility classes:

```tsx
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
    Title
  </h2>
</div>
```

#### Custom CSS

For complex styles, use CSS Modules or styled-components:

```tsx
// MyComponent.module.css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

// MyComponent.tsx
import styles from './MyComponent.module.css';

<div className={styles.container}>
  {/* content */}
</div>
```

#### Theme Support

Dark mode is handled by `next-themes`:

```tsx
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();

<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  Toggle Theme
</button>
```

### Debugging

#### React Query Devtools

Enabled in development:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

Access at bottom-right of screen when app is running.

#### Browser DevTools

- React DevTools extension
- Redux DevTools extension (if using Redux)
- Network tab for API calls
- Console for error messages

#### Logging

```typescript
console.log('Debug:', data);
console.error('Error:', error);
console.warn('Warning:', message);
```

For production, use a logging service (Sentry, LogRocket, etc.).

---

## 🚢 Deployment

### Vercel Deployment (Recommended)

PrintHub is optimized for Vercel deployment.

#### Steps:

1. **Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/PrintHub.git
git push -u origin main
```

2. **Import to Vercel**

- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your repository
- Configure build settings:
  - Framework Preset: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`

3. **Add Environment Variables**

In Vercel dashboard → Settings → Environment Variables:

- Add all `VITE_*` variables from your `.env`
- Set `NODE_ENV=production`

4. **Deploy**

Vercel will automatically deploy on every push to main branch.

#### Custom Domain

1. Add domain in Vercel dashboard
2. Configure DNS records
3. SSL automatically provisioned

### Netlify Deployment

1. **Build settings**

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Deploy**

```bash
npm install -g netlify-cli
netlify init
netlify deploy --prod
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t printhub-frontend .
docker run -p 80:80 printhub-frontend
```

### Environment-Specific Configuration

#### Development

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

#### Staging

```env
VITE_API_BASE_URL=https://staging-api.printhub.com/api
```

#### Production

```env
VITE_API_BASE_URL=https://api.printhub.com/api
```

### Performance Optimization

- Enable compression (gzip/brotli)
- Configure CDN for static assets
- Set proper cache headers
- Enable HTTP/2
- Optimize images with Cloudinary

### Security Considerations

- Set `Content-Security-Policy` headers
- Enable HTTPS only
- Configure CORS properly
- Sanitize user inputs
- Keep dependencies updated

---

## 🧪 Testing

### Manual Testing Checklist

See `TESTING_CHECKLIST.md` for comprehensive testing guide.

#### Basic Functionality

- [ ] User can sign up and sign in
- [ ] User can upload files
- [ ] User can configure print settings
- [ ] User can select printer
- [ ] User can make payment
- [ ] Print job is created successfully
- [ ] Job appears in queue
- [ ] Job status updates in real-time
- [ ] User receives notifications

#### Admin Functionality

- [ ] Admin can view all users
- [ ] Admin can create staff accounts
- [ ] Admin can add/edit/delete printers
- [ ] Admin can configure pricing
- [ ] Admin can approve cash payments
- [ ] Admin can view and respond to queries
- [ ] Admin receives printer error notifications

#### Edge Cases

- [ ] Large file upload (>5MB)
- [ ] Network interruption during upload
- [ ] Printer offline during job submission
- [ ] Invalid print settings
- [ ] Payment failure handling
- [ ] Session expiration

### Automated Testing (Future)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 🤝 Contributing

We welcome contributions from the community!

### How to Contribute

1. **Fork the repository**

2. **Create a feature branch**

```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**

4. **Commit with conventional commits**

```bash
git commit -m "feat: add amazing feature"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

5. **Push to your fork**

```bash
git push origin feature/amazing-feature
```

6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Write TypeScript types for all new code
- Update documentation for new features
- Test your changes thoroughly
- Keep PRs focused on single feature/fix

### Code Review Process

1. Automated checks must pass (linting, type checking)
2. At least one maintainer approval required
3. All conversations must be resolved
4. Squash and merge to main branch

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 PrintHub Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support & Contact

### Documentation

- **Frontend**: This README
- **Backend**: `server/README.md`
- **Features**: Individual feature documentation files
- **API**: Backend API documentation in server README

### Get Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/PrintHub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/PrintHub/discussions)
- **Email**: support@printhub.com

### Community

- **Discord**: [Join our Discord](https://discord.gg/printhub)
- **Twitter**: [@PrintHubApp](https://twitter.com/PrintHubApp)

---

## 🙏 Acknowledgments

### Technologies

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Clerk](https://clerk.com/) - Authentication
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Cloudinary](https://cloudinary.com/) - Media management

### Contributors

Thanks to all contributors who have helped build PrintHub!

---

## 📊 Project Statistics

- **Components**: 40+ reusable UI components
- **Pages**: 15+ application pages
- **API Endpoints**: 50+ RESTful endpoints
- **Lines of Code**: ~15,000+ (frontend), ~10,000+ (backend)
- **Dependencies**: 50+ production dependencies

---

## 🔮 Roadmap

### Upcoming Features

- [ ] Mobile app (React Native)
- [ ] Batch operations (bulk actions)
- [ ] Advanced reporting and analytics
- [ ] Email notification templates customization
- [ ] SMS notifications
- [ ] Wallet/Credits system
- [ ] Print scheduling (schedule for later)
- [ ] QR code printing
- [ ] Document OCR and text extraction
- [ ] Multi-language support (i18n)
- [ ] Dark mode improvements
- [ ] PWA features (offline support)
- [ ] Print job templates
- [ ] User roles hierarchy
- [ ] API rate limiting per user
- [ ] Comprehensive test suite
- [ ] Docker Compose setup
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Load testing and optimization
- [ ] Security audit

### Long-term Vision

- Enterprise SSO integration
- Multi-tenancy support
- Blockchain-based transaction logging
- AI-powered print optimization
- Carbon footprint tracking
- Eco-friendly printing recommendations

---

<div align="center">

**Built with ❤️ by the PrintHub Team**

[⭐ Star on GitHub](https://github.com/yourusername/PrintHub) • [🐛 Report Bug](https://github.com/yourusername/PrintHub/issues) • [💬 Discussions](https://github.com/yourusername/PrintHub/discussions)

**Version 1.0.0** | Last Updated: October 2025

</div>
