# 🖨️ PrintHub

> **A modern, full-featured printing service platform built with React 18 and TypeScript**

PrintHub is a comprehensive digital printing solution that streamlines the entire printing workflow - from file upload to job completion. Designed with modern web technologies and a user-centric approach, it provides an intuitive interface for managing print jobs, configuring settings, and tracking printing history.

![React](https://img.shields.io/badge/React-18.x-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Vite](https://img.shields.io/badge/Vite-Latest-purple.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-teal.svg)

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
- Interactive elements and overlays

### State Management
- **Context API**: Global state management for print jobs and uploads
- **Local State**: Component-level state with React hooks
- **Type Safety**: Full TypeScript integration

## 🌐 Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# API Configuration
VITE_API_BASE_URL=your_api_base_url

# Payment Configuration (if applicable)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

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