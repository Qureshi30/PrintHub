// User types
export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  studentId: string;
  yearOfStudy: number;
}

export interface UserAccount {
  creditBalance?: number;
  totalSpent: number;
  status: 'active' | 'suspended' | 'inactive';
  registeredAt: Date;
  lastLoginAt: Date;
  loginCount: number;
}

export interface UserStatistics {
  totalJobs: number;
  jobsThisMonth: number;
  favoriteLocation: string;
  mostUsedPaperType: string;
  averageJobCost: number;
}

export interface UserPreferences {
  defaultPaperType: string;
  defaultColor: boolean;
  defaultDuplex: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface User {
  _id: string;
  clerkUserId: string;
  role: 'student' | 'admin' | 'staff';
  profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  preferences: {
    emailNotifications: boolean;
    defaultPaperType: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Certificate';
    defaultColor: boolean;
  };
  statistics: {
    totalJobs: number;
    totalSpent: number;
    completedJobs: number;
  };
  status: 'active' | 'suspended' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

// Print Job types
export interface PrintJobFile {
  cloudinaryUrl: string;
  publicId: string;
  format: string;
  sizeKB: number;
}

export interface PrintSettings {
  pages: string;
  copies: number;
  color: boolean;
  duplex: boolean;
  paperType: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Certificate';
}

export interface PrintJobPricing {
  costPerPage: number;
  colorSurcharge: number;
  paperTypeSurcharge: number;
  totalCost: number;
  currency: string;
}

export interface PrintJobPayment {
  status: 'pending' | 'paid' | 'refunded';
  method: 'student_credit' | 'card' | 'campus_card';
  transactionId: string;
  paidAt: Date;
}

export interface PrintJobTiming {
  submittedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalProcessingTime?: number;
}

export interface PrintJob {
  _id: string;
  clerkUserId: string;
  printerId: string;
  file: PrintJobFile;
  settings: PrintSettings;
  status: 'pending' | 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled';
  queuePosition?: number;
  estimatedCompletionTime?: Date;
  pricing?: PrintJobPricing;
  payment?: PrintJobPayment;
  timing?: PrintJobTiming;
  misprint: boolean;
  reprintCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Printer types
export interface PrinterResources {
  inkLevel: number;
  paperLevel: number;
  tonerLevel: number;
  lowPaperThreshold: number;
  lowInkThreshold: number;
}

export interface PrinterMaintenance {
  lastMaintenanceDate: Date;
  nextMaintenanceDate: Date;
  maintenanceInterval: number;
  maintenanceNotes: string;
}

export interface PrinterStatistics {
  jobsToday: number;
  jobsThisMonth: number;
  totalJobs: number;
  averageJobTime: number;
  uptimePercentage: number;
}

export interface PrinterAlert {
  type: 'low_paper' | 'low_ink' | 'maintenance_due' | 'error';
  message: string;
  severity: 'warning' | 'critical';
  createdAt: Date;
  acknowledged: boolean;
}

export interface Printer {
  _id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' | 'busy';
  queue: string[]; // Array of job IDs
  supportedPaperTypes: string[];
  inkLevel: number;
  paperLevel: number;
  resources?: PrinterResources;
  maintenance?: PrinterMaintenance;
  statistics?: PrinterStatistics;
  alerts?: PrinterAlert[];
  lastChecked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export interface Notification {
  _id: string;
  clerkUserId: string;
  jobId?: string;
  type: 'job_completed' | 'job_failed' | 'reprint' | 'queue_update' | 'maintenance';
  message: string;
  read: boolean;
  createdAt: Date;
}

// Admin Log types
export interface AdminLog {
  _id: string;
  adminId: string;
  action: 'printer_online' | 'user_registration' | 'paper_warning' | 'job_completed' | 'maintenance_scheduled' | 'reprint' | 'cancel_job' | 'printer_maintenance' | 'user_action';
  targetType?: 'printer' | 'user' | 'job' | 'system';
  targetId?: string;
  description?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  metadata?: AdminLogMetadata;
  jobId?: string;
  printerId?: string;
  userId?: string;
  timestamp: Date;
  notes?: string;
  resolved?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Upload types (for Cloudinary)
export interface UploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
}

// Admin Logs types (Enhanced)
export interface AdminLogMetadata {
  printerName?: string;
  userEmail?: string;
  oldValue?: string;
  newValue?: string;
  [key: string]: any;
}

// Financial Transaction types
export interface TransactionMetadata {
  pages: number;
  copies: number;
  paperType: string;
  color: boolean;
}

export interface FinancialTransaction {
  _id: string;
  clerkUserId: string;
  jobId: string;
  type: 'payment' | 'refund' | 'credit_purchase';
  amount: number;
  currency: string;
  method: 'student_credit' | 'card' | 'campus_card';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata: TransactionMetadata;
  createdAt: Date;
  processedAt?: Date;
}

// System Settings types
export interface SystemPricing {
  baseCostPerPage: number;
  colorSurcharge: number;
  paperTypePricing: {
    [key: string]: number;
  };
}

export interface SystemLimits {
  maxFileSizeMB: number;
  maxPagesPerJob: number;
  maxJobsPerDay: number;
  queueTimeoutMinutes: number;
}

export interface SystemMaintenance {
  systemMaintenanceWindow: string;
  autoCleanupDays: number;
  maxQueueSize: number;
}

export interface SystemNotifications {
  emailEnabled: boolean;
  smsEnabled: boolean;
  slackWebhook?: string;
}

export interface SystemSettings {
  _id: string;
  pricing: SystemPricing;
  limits: SystemLimits;
  maintenance: SystemMaintenance;
  notifications: SystemNotifications;
}
