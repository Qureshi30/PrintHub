# 🖨️ PrintHub - Advanced University Printing Management System

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-Latest-purple.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-teal.svg)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-orange.svg)](https://clerk.dev/)

A comprehensive, enterprise-grade printing management system designed for educational institutions. PrintHub revolutionizes campus printing with intelligent queue management, real-time monitoring, cash payment support, mobile-responsive design, and advanced analytics.

## 🌟 Key Features

### 👥 Multi-Role System
- **Student Portal**: Upload, schedule, and track print jobs
- **Admin Dashboard**: Comprehensive system management and analytics
- **Staff Features**: Priority printing and advanced controls

### 💳 Flexible Payment Options
- **Digital Payments**: Razorpay integration for secure online transactions
- **Cash Payment System**: Offline payment support with admin approval workflow
- **Payment Tracking**: Complete transaction history and refund management

### 🖨️ Advanced Printer Management
- **SNMP Discovery**: Automatic printer detection and monitoring
- **Real-time Status**: Live printer status, queue length, and ink levels
- **Error Handling**: Comprehensive error logging and notification system
- **Queue Management**: Intelligent job prioritization and processing

### 📱 Mobile-First Design
- **Responsive UI**: Optimized for all device sizes
- **Dark/Light Mode**: System-wide theme support
- **Touch-Optimized**: Mobile-friendly interactions and navigation
- **Progressive Web App**: Installable on mobile devices

### 🔐 Enterprise Security
- **Clerk Authentication**: Industry-standard user management
- **Role-Based Access**: Granular permission system
- **API Security**: Rate limiting, validation, and encryption
- **File Security**: Secure upload and storage with Cloudinary

## 🏗️ Technical Architecture

### Frontend Stack
```
React 18 + TypeScript + Vite
├── UI Framework: shadcn/ui + Radix UI + Tailwind CSS
├── State Management: TanStack Query + React Context
├── Routing: React Router DOM v6
├── Forms: React Hook Form + Zod validation
├── Authentication: Clerk React SDK
├── Charts: Recharts for analytics
└── File Processing: PDF.js + Mammoth.js
```

### Backend Stack
```
Node.js + Express.js
├── Database: MongoDB + Mongoose ODM
├── Authentication: Clerk Node SDK
├── File Storage: Cloudinary API
├── Payment: Razorpay Gateway
├── Email: EmailJS + Nodemailer
├── Real-time: Socket.io
├── Validation: Express Validator
├── Security: Helmet + CORS + Rate Limiting
└── Monitoring: SNMP for printer discovery
```

### Database Schema
```
Collections:
├── Users (students, staff, admins)
├── PrintJobs (job details, status, pricing)
├── Printers (SNMP data, status, queues)
├── CashPrintRequests (offline payment workflow)
├── PrinterErrors (error logs and monitoring)
├── Notifications (system alerts)
├── AdminLogs (audit trail)
└── Revenue (financial tracking)
```

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Cloudinary Account** (for file storage)
- **Clerk Account** (for authentication)
- **Razorpay Account** (for payments, optional)

### 1. Repository Setup
```bash
git clone https://github.com/Qureshi30/PrintHub.git
cd PrintHub
```

### 2. Backend Configuration
```bash
cd server
npm install

# Create environment configuration
cp .env.example .env
```

**Environment Variables (.env):**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/printhub
# or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/printhub

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Cloudinary File Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_key_secret

# EmailJS Configuration
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
EMAILJS_PUBLIC_KEY=your_public_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Frontend Configuration
```bash
cd .. # Return to root directory
npm install

# Create environment configuration
cp .env.example .env.local
```

**Environment Variables (.env.local):**
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# API Configuration
VITE_API_URL=http://localhost:3001/api

# Cloudinary (for frontend uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Razorpay (for frontend integration)
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

### 4. Database Setup
```bash
cd server

# Initialize database with sample data
node scripts/initDatabase.js

# Seed printers (optional)
node scripts/seedPrinters.js
```

### 5. Start Development Servers

**Backend Server:**
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

**Frontend Application:**
```bash
# In new terminal, from root directory
npm run dev
# Application runs on http://localhost:8080
```

## 📂 Project Structure

```
PrintHub/
├── 📁 src/                          # Frontend source code
│   ├── 📁 components/               # Reusable UI components
│   │   ├── 📁 admin/               # Admin-specific components
│   │   ├── 📁 auth/                # Authentication components
│   │   ├── 📁 layout/              # Layout components
│   │   ├── 📁 mobile/              # Mobile-optimized components
│   │   └── 📁 ui/                  # Base UI components (shadcn/ui)
│   ├── 📁 pages/                   # Application pages
│   │   ├── 📁 admin/               # Admin dashboard pages
│   │   ├── 📁 features/            # Feature showcase pages
│   │   ├── 📁 shared/              # Shared pages (auth, errors)
│   │   └── 📁 student/             # Student portal pages
│   ├── 📁 hooks/                   # Custom React hooks
│   ├── 📁 context/                 # React context providers
│   ├── 📁 services/                # API service functions
│   ├── 📁 lib/                     # Utility libraries
│   ├── 📁 types/                   # TypeScript type definitions
│   └── 📁 utils/                   # Helper functions
├── 📁 server/                       # Backend source code
│   └── 📁 src/
│       ├── 📁 config/              # Configuration files
│       ├── 📁 controllers/         # Route controllers
│       ├── 📁 middleware/          # Express middleware
│       ├── 📁 models/              # Mongoose schemas
│       ├── 📁 routes/              # API route definitions
│       ├── 📁 services/            # Business logic services
│       ├── 📁 scripts/             # Database scripts
│       └── 📁 utils/               # Server utilities
├── 📁 public/                      # Static assets
└── 📄 Configuration files          # Package.json, configs, etc.
```

## 🔑 Core Features

### Student Portal Features
- **📄 Document Upload**: Multi-format support (PDF, DOCX, images)
- **⚙️ Print Settings**: Page range, copies, color, duplex options
- **🖨️ Printer Selection**: Real-time availability and queue status
- **📅 Job Scheduling**: Schedule prints for specific times
- **💳 Payment Processing**: Secure online and offline payment options
- **📊 Queue Monitoring**: Real-time job status and queue position
- **📈 Print History**: Complete transaction and job history
- **🔔 Notifications**: Email and SMS alerts for job updates
- **⚙️ User Settings**: Profile management and preferences

### Admin Dashboard Features
- **👥 User Management**: Student/staff account management
- **🖨️ Printer Management**: Add, configure, and monitor printers
- **📊 Analytics Dashboard**: Usage statistics and revenue tracking
- **💰 Cash Payment Approval**: Manual payment verification workflow
- **🔧 System Configuration**: Email templates and notification settings
- **📋 Error Monitoring**: Printer error logs and system health
- **📈 Revenue Tracking**: Financial reports and analytics
- **🔐 Admin Logs**: Complete audit trail of admin actions

### Advanced Features
- **🔍 SNMP Printer Discovery**: Automatic network printer detection
- **⚡ Real-time Updates**: Socket.io for live status updates
- **📱 Mobile Progressive Web App**: Installable mobile experience
- **🌙 Dark/Light Mode**: System-wide theme switching
- **🔒 Role-Based Security**: Granular permission system
- **📧 Email Integration**: Automated notifications and alerts
- **💾 File Processing**: Advanced document parsing and validation
- **🔄 Queue Optimization**: Intelligent job prioritization

## 🔧 API Endpoints

### Authentication Routes
```
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
POST   /api/auth/register           # User registration
GET    /api/auth/profile            # Get user profile
```

### Print Job Management
```
POST   /api/print-jobs              # Create new print job
GET    /api/print-jobs              # Get user's print jobs
GET    /api/print-jobs/:id          # Get specific print job
PUT    /api/print-jobs/:id          # Update print job
DELETE /api/print-jobs/:id          # Cancel print job
```

### Printer Management
```
GET    /api/printers                # Get all printers
GET    /api/printers/:id            # Get specific printer
POST   /api/printers                # Add new printer (admin)
PUT    /api/printers/:id            # Update printer (admin)
DELETE /api/printers/:id            # Remove printer (admin)
GET    /api/printers/:id/status     # Get printer status
```

### Payment Processing
```
POST   /api/payments/create         # Create payment intent
POST   /api/payments/verify         # Verify payment
GET    /api/payments/history        # Get payment history
POST   /api/cash-payment/upload     # Submit cash payment request
GET    /api/cash-payment/pending    # Get pending cash payments (admin)
PUT    /api/cash-payment/:id/approve # Approve cash payment (admin)
```

### Admin Operations
```
GET    /api/admin/users             # Get all users
PUT    /api/admin/users/:id         # Update user role
GET    /api/admin/analytics         # Get system analytics
GET    /api/admin/logs              # Get admin logs
POST   /api/admin/notifications     # Send system notifications
```

## 🎨 UI Components

### Design System
- **Component Library**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Lucide React icon library
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: WCAG 2.1 AA compliance
- **Theme System**: CSS variables for dark/light mode switching

### Mobile Components
- **AdminMobileHeader**: Navigation header for admin pages
- **AdminMobileSidebar**: Collapsible navigation menu
- **MobileCard**: Touch-optimized card component
- **MobileTouchButton**: Large, accessible button component
- **MobileStepNavigation**: Progress indicator for multi-step flows

## 🔒 Security Features

### Authentication & Authorization
- **Clerk Integration**: Enterprise-grade authentication
- **JWT Tokens**: Secure session management
- **Role-Based Access Control**: Student, Staff, Admin roles
- **API Security**: Request validation and rate limiting

### Data Protection
- **Input Validation**: Server-side validation with express-validator
- **SQL Injection Prevention**: Mongoose ODM protection
- **File Upload Security**: Type validation and size limits
- **CORS Configuration**: Cross-origin request security
- **Helmet.js**: Security headers and XSS protection

## 📊 Monitoring & Analytics

### System Monitoring
- **Printer Status**: Real-time SNMP monitoring
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: API response times and usage statistics
- **Queue Analytics**: Job processing times and efficiency metrics

### Business Analytics
- **Revenue Tracking**: Daily, weekly, monthly financial reports
- **Usage Statistics**: Print volume and user activity analysis
- **Printer Utilization**: Equipment usage optimization data
- **User Behavior**: Printing patterns and preferences

## 🚀 Deployment

### Production Deployment
```bash
# Build frontend
npm run build

# Start production server
cd server
npm start
```

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Environment Setup
- **Frontend**: Deploy to Vercel, Netlify, or AWS S3
- **Backend**: Deploy to Railway, Heroku, or AWS EC2
- **Database**: MongoDB Atlas for managed database
- **File Storage**: Cloudinary for scalable file management

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting standards
- **Conventional Commits**: Standardized commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions for questions
- **Email**: Contact the development team

### Common Issues
- **Authentication**: Ensure Clerk keys are properly configured
- **Database**: Verify MongoDB connection string
- **File Uploads**: Check Cloudinary configuration
- **Payments**: Confirm Razorpay credentials are set

## 🎯 Future Roadmap

### Planned Features
- **Mobile App**: Native iOS/Android applications
- **Advanced Analytics**: Machine learning insights
- **Multi-University**: Support for multiple institutions
- **API v2**: GraphQL API implementation
- **Blockchain**: Immutable audit trails
- **AI Integration**: Smart document processing

### Performance Improvements
- **Caching**: Redis implementation for faster responses
- **CDN**: Content delivery network for global performance
- **Microservices**: Service decomposition for scalability
- **Load Balancing**: Horizontal scaling capabilities

---

**PrintHub** - Transforming university printing with modern technology 🖨️✨

*Built with ❤️ by the PrintHub development team*
npm start
```

### 3. Frontend Setup

```bash
# In a new terminal, from project root
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# Start frontend development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health
npm run dev
```

### 3. Frontend Setup

```bash
# In a new terminal, from project root
npm install

# Start frontend development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## 📁 Project Structure

```
PrintHub/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── auth/                 # Authentication components
│   │   ├── layout/               # Layout components
│   │   ├── sections/             # Landing page sections
│   │   ├── ui/                   # shadcn/ui components
│   │   └── upload/               # File upload components
│   ├── pages/                    # Page components
│   │   ├── admin/                # Admin dashboard pages
│   │   ├── shared/               # Shared pages
│   │   └── student/              # Student dashboard pages
│   ├── hooks/                    # Custom React hooks
│   │   ├── useDatabase.ts        # Database integration hooks
│   │   ├── useBackendUpload.ts   # File upload hooks
│   │   └── useCloudinaryUpload.ts # Cloudinary integration
│   ├── lib/                      # Frontend utilities
│   ├── types/                    # TypeScript definitions
│   └── context/                  # React context providers
├── server/                       # Backend Node.js application
│   ├── src/
│   │   ├── config/               # Database and service configs
│   │   ├── middleware/           # Express middleware
│   │   ├── models/               # MongoDB schemas
│   │   ├── routes/               # API route handlers
│   │   └── index.js              # Main server file
│   ├── seed-printers.js          # Database seeding script
│   └── setup.js                  # Database setup script
├── DATABASE_INTEGRATION.md       # Database documentation
├── ENV_STATUS_REPORT.md          # Environment configuration guide
├── IMPLEMENTATION_SUMMARY.md     # Implementation details
└── README.md                     # This file
```

## 🔧 Configuration

### Backend Environment (.env in server/)

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

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Security
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment (.env in root/)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_CLOUDINARY_API_KEY=your_api_key

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# EmailJS Configuration (optional)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

## 📊 Features Implemented

### ✅ Core Functionality
- **File Upload**: Drag-and-drop file upload with Cloudinary integration
- **Print Job Management**: Create, track, and manage print jobs
- **User Authentication**: Secure authentication with Clerk
- **Admin Dashboard**: Comprehensive admin panel for system management
- **Student Dashboard**: User-friendly interface for students

### ✅ File Management
- **Multiple File Types**: Support for PDF, DOC, DOCX, PPT, PPTX, images
- **File Validation**: Size limits, type checking, and error handling
- **Cloud Storage**: Cloudinary integration for reliable file storage
- **Progress Tracking**: Real-time upload progress indicators

### ✅ Print System
- **Printer Management**: Add, configure, and monitor printers
- **Queue System**: Organized print job queuing and processing
- **Status Tracking**: Real-time job status updates
- **Cost Calculation**: Automatic pricing based on settings

### ✅ User Management
- **Role-Based Access**: Student, Admin, and Staff roles
- **Profile Management**: User profile and preferences
- **Authentication Flow**: Secure login/logout with Clerk
- **Protected Routes**: Route-level access control
- User preferences and settings

### ✅ Print Job Management
- File upload with Cloudinary integration
- Print job creation and tracking
- Queue management and status updates
- Job cancellation and reprinting

### ✅ Printer Management
- Multiple printer support
- Real-time status monitoring
- Supply level tracking
- Maintenance mode support

### ✅ File Upload System
- Drag-and-drop file upload
- Multiple file format support
- File size and type validation
- Progress tracking and error handling

### ✅ Dashboard & Analytics
- Student dashboard with real-time statistics
- Print job history and status
- Cost calculation and tracking
- Available printer display

### ✅ Notification System
- Real-time notifications for job updates
- Email notifications (configurable)
- Notification history and management

### ✅ Admin Features
- Comprehensive admin dashboard
- User and printer management
- Activity logging and audit trails
- System configuration

## 🔌 API Endpoints

### Core APIs
- **Users**: User management and statistics
- **Print Jobs**: Job creation, tracking, and management
- **Printers**: Printer status and queue management
- **Notifications**: User notification system
- **File Upload**: Cloudinary integration for file handling
- **Admin Logs**: Administrative action tracking

See [Database Integration Guide](DATABASE_INTEGRATION.md) for complete API documentation.

## 🗄️ Database Schema

### Collections
- **Users**: Account information and preferences
- **PrintJobs**: Print job records with file references
- **Printers**: Printer specifications and status
- **Notifications**: User notification system
- **AdminLogs**: Administrative action tracking

See [Database Integration Guide](DATABASE_INTEGRATION.md) for detailed schema information.

## 🧪 Testing

### Backend Testing
```bash
cd server

# Test API endpoints
node test.js

# Test with verbose output
node test.js --verbose
```

### Frontend Testing
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Development Workflow

### Backend Development
```bash
cd server
npm run dev    # Start with nodemon for auto-reload
```

### Frontend Development
```bash
npm run dev    # Start Vite development server
```

### Database Management
```bash
cd server

# Setup database with sample data
node setup.js

# Reset database (WARNING: deletes all data)
node setup.js --reset

# Create environment file
node setup.js --env
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or hosted MongoDB
2. Configure Cloudinary production settings
3. Set up Clerk production keys
4. Deploy to your hosting platform (Heroku, DigitalOcean, etc.)

### Frontend Deployment
1. Update API URLs for production
2. Build the application: `npm run build`
3. Deploy the `dist` folder to your hosting platform

## 🔐 Security Features

- **Authentication**: Clerk-based secure authentication
- **Authorization**: Role-based access control
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Comprehensive request validation
- **File Security**: File type and size restrictions
- **Error Handling**: Secure error responses

## 📚 Tech Stack Details

### Frontend
- **React 18**: Modern React with hooks and context
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **React Query**: Server state management
- **React Router**: Client-side routing
- **Clerk**: Authentication and user management

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Cloudinary**: Cloud-based image and video management
- **Express Validator**: Input validation middleware
- **Helmet**: Security middleware
- **Morgan**: HTTP request logger

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
1. Check the documentation
2. Review the API endpoints
3. Test with the provided scripts
4. Check the error logs

## 🎯 Next Steps

- [ ] Real-time WebSocket updates
- [ ] Payment integration
- [ ] Email notification templates
- [ ] Mobile responsive improvements
- [ ] Advanced reporting and analytics
- [ ] Print job scheduling
- [ ] Bulk operations
- [ ] API rate limiting per user
- [ ] Comprehensive test suite
- [ ] Docker containerization

## ✨ Features

### 🔐 **Authentication & Security**
- Secure user authentication with Clerk integration
- Protected routes and role-based access control
- User profile management and settings

### 📁 **File Management**
- **Multi-format Support**: PDF, DOC, DOCX, images, and more
- **Drag & Drop Upload**: Intuitive file upload interface
- **File Preview**: Preview documents before printing
- **Batch Upload**: Upload multiple files simultaneously

### ⚙️ **Print Configuration**
- **Custom Print Settings**: Paper size, orientation, quality, copies
- **Per-file Configuration**: Individual settings for each document
- **Print Profiles**: Save and reuse common configurations
- **Advanced Options**: Duplex printing, color settings, margins

### 🖨️ **Printer Management**
- **Printer Selection**: Choose from available printers
- **Real-time Status**: Monitor printer availability and status
- **Queue Management**: View and manage print queues

### 💳 **Payment & Billing**
- Integrated payment processing
- Cost calculation based on print settings
- Payment history and invoices
- Multiple payment methods support

### 📊 **Job Management**
- **Print History**: Complete record of all print jobs
- **Job Scheduling**: Schedule prints for later execution
- **Status Tracking**: Real-time job status updates

### 🎨 **User Experience**
- **Responsive Design**: Works seamlessly on all devices
- **Dark/Light Theme**: Toggle between themes
- **Intuitive Navigation**: Clean, modern interface
- **Accessibility**: WCAG compliant design

## 🛠️ Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript 5.x |
| **Build Tool** | Vite (Hot reload, Fast builds) |
| **Styling** | Tailwind CSS, CSS Modules |
| **UI Library** | shadcn/ui (40+ components) |
| **Authentication** | Clerk |
| **State Management** | React Context API |
| **Routing** | React Router v6 |
| **Package Manager** | npm/bun |
| **Code Quality** | ESLint, Prettier |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- npm/yarn/bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Prem-Hanchate/PrintHub.git
   cd PrintHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Configure your Clerk keys and other environment variables
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run build:dev` | Build development bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality checks |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run type-check` | Run TypeScript type checking |

## 📁 Project Structure

```
PrintHub/
├── 📁 public/                 # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── 📁 src/
│   ├── 📁 components/         # Reusable React components
│   │   ├── 📁 auth/          # Authentication components
│   │   ├── 📁 layout/        # Layout components
│   │   ├── 📁 sections/      # Page sections
│   │   ├── 📁 ui/            # UI component library (40+ components)
│   │   └── 📁 upload/        # File upload components
│   ├── 📁 context/           # React Context providers
│   │   ├── PrintJobContext.tsx
│   │   └── UploadContext.tsx
│   ├── 📁 hooks/             # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── 📁 lib/               # Utility functions and configurations
│   │   └── utils.ts
│   ├── 📁 pages/             # Application pages/routes
│   │   ├── Index.tsx         # Landing page
│   │   ├── Upload.tsx        # File upload
│   │   ├── PrintSettings.tsx # Print configuration
│   │   ├── SelectPrinter.tsx # Printer selection
│   │   ├── Payment.tsx       # Payment processing
│   │   ├── Queue.tsx         # Job queue
│   │   ├── History.tsx       # Print history
│   │   └── ...              # Additional pages
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── 📄 package.json           # Dependencies and scripts
├── 📄 tsconfig.json          # TypeScript configuration
├── 📄 tailwind.config.ts     # Tailwind CSS configuration
├── 📄 vite.config.ts         # Vite build configuration
└── 📄 components.json        # shadcn/ui configuration
```

## 🔧 Development

### Code Quality
This project maintains high code quality standards with:
- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code linting and best practices
- **Prettier**: Consistent code formatting
- **Component Architecture**: Modular, reusable components

### Component Library
Built with a comprehensive UI component library including:
- Forms, inputs, and validation
- Navigation and layout components
- Data display and feedback components
## 🔧 Development

### Running Tests
```bash
# Frontend tests
npm test

# Backend tests
cd server && npm test
```

### Database Management
```bash
# Seed printers data
cd server && node seed-printers.js

# Setup initial database
cd server && node setup.js
```

### API Testing
Use the provided API endpoints:
- **Health Check**: GET /health
- **Printers**: GET /api/printers
- **Upload**: POST /api/upload/file
- **Print Jobs**: POST /api/upload/print-job

## 📝 Documentation

- **[Database Integration](DATABASE_INTEGRATION.md)**: Database schema and setup
- **[Environment Setup](ENV_STATUS_REPORT.md)**: Environment configuration guide
- **[Implementation Details](IMPLEMENTATION_SUMMARY.md)**: Technical implementation summary

## 🚀 Deployment

### Build for Production
```bash
# Frontend
npm run build

# Backend
cd server && npm install --production
```

### Environment Variables for Production
Ensure all environment variables are configured for production deployment:
- Database connection strings
- Cloudinary credentials
- Clerk authentication keys
- CORS origins
- JWT secrets

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Frontend**: Modern React application with TypeScript
- **Backend**: RESTful API with Express and MongoDB
- **Documentation**: Comprehensive guides and API documentation
- **Authentication**: Secure user management with Clerk

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and patterns
- Add TypeScript types for all new code
- Update tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Clerk](https://clerk.com/) - Authentication service

## 📞 Support

For support and questions:
- 📧 Email: support@printhub.com
- 🐛 Issues: [GitHub Issues](https://github.com/Prem-Hanchate/PrintHub/issues)
- 📖 Documentation: [Wiki](https://github.com/Prem-Hanchate/PrintHub/wiki)

---

<div align="center">
  <p><strong>Built with ❤️ by the PrintHub Team</strong></p>
  <p>
    <a href="https://github.com/Prem-Hanchate/PrintHub">⭐ Star us on GitHub</a> •
    <a href="https://github.com/Prem-Hanchate/PrintHub/issues">🐛 Report Bug</a> •
    <a href="https://github.com/Prem-Hanchate/PrintHub/discussions">💬 Discussions</a>
  </p>
</div>