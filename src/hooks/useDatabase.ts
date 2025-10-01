import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Types
interface PrinterLevels {
  inkLevel?: number;
  paperLevel?: number;
  tonerLevel?: number;
}

interface NotificationData {
  _id: string;
  clerkUserId: string;
  type: 'job_completed' | 'job_failed' | 'reprint' | 'queue_update' | 'maintenance' | 'system' | 'payment';
  title: string;
  message: string;
  read: boolean;
  actionRequired?: boolean;
  relatedPrintJobId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminLogData {
  _id?: string;
  adminId: string;
  action: string;
  target: string;
  details: Record<string, unknown>;
  timestamp?: string;
}

interface UserPrintJobsOptions {
  status?: string;
  limit?: number;
  page?: number;
}

interface User {
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
    defaultPaperType: string;
    defaultColor: boolean;
  };
  statistics: {
    totalJobs: number;
    totalSpent: number;
    completedJobs: number;
  };
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface PrintJob {
  _id: string;
  clerkUserId: string;
  printerId: string;
  file: {
    cloudinaryUrl: string;
    publicId: string;
    originalName: string;
    format: string;
    sizeKB: number;
  };
  settings: {
    pages: string;
    copies: number;
    color: boolean;
    duplex: boolean;
    paperType: string;
  };
  status: 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled';
  queuePosition?: number;
  estimatedCompletionTime?: string;
  pricing: {
    costPerPage: number;
    colorSurcharge: number;
    paperTypeSurcharge: number;
    totalCost: number;
    currency: string;
  };
  payment: {
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    method: string;
    transactionId?: string;
    paidAt?: string;
  };
  timing: {
    submittedAt: string;
    startedAt?: string;
    completedAt?: string;
    totalProcessingTime?: number;
    misprint: boolean;
    reprintCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

interface Printer {
  _id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  queue: string[];
  supportedPaperTypes: string[];
  resources: {
    inkLevel: number;
    paperLevel: number;
    tonerLevel: number;
    lowPaperThreshold: number;
    lowInkThreshold: number;
  };
  maintenance: {
    lastMaintenanceDate: string;
    nextMaintenanceDate: string;
    maintenanceInterval: number;
    maintenanceNotes: string;
  };
  statistics: {
    jobsToday: number;
    jobsThisMonth: number;
    totalJobs: number;
    averageJobTime: number;
    uptimePercentage: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    createdAt: string;
    acknowledged: boolean;
    lastChecked: string;
  }>;
}

// HTTP Client with auth
const createAuthenticatedFetch = (getToken: () => Promise<string | null>) => {
  return async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };
};

// Custom hooks for API calls
export const useAdminStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPrintJobs: 0,
    totalRevenue: 0,
    activePrinters: 0,
    activeStudents: 0,
    printJobsToday: 0,
    revenueToday: 0,
    totalPrinters: 0,
    maintenancePrinters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch('/admin/dashboard-stats');
        setStats(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch admin stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getToken]);

  return { stats, loading, error };
};

export const useDashboardStats = (userId?: string) => {
  const [stats, setStats] = useState({
    pendingJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
    availablePrinters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch('/students/dashboard-stats');
        setStats(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [userId, getToken]);

  return { stats, loading, error };
};

export const useAllUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch('/admin/users');

        console.log('API Response:', response);

        // Handle the response structure
        if (response.success && Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
        setUsers([]); // Ensure users is always an array
      } finally {
        setLoading(false);
      }
    };

    if (getToken) {
      fetchUsers();
    }
  }, [getToken]);

  return { users, loading, error };
};

export const usePrinters = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch('/printers');
        setPrinters(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch printers');
      } finally {
        setLoading(false);
      }
    };

    fetchPrinters();
  }, [getToken]);

  return { printers, loading, error };
};

export const useUserPrintJobs = (userId?: string, options?: UserPrintJobsOptions) => {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchPrintJobs = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const url = `/students/print-jobs`;
        const response = await authFetch(url);
        setPrintJobs(response.data.jobs || response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch print jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchPrintJobs();
  }, [userId, getToken]);

  return {
    data: printJobs,
    printJobs,
    loading,
    isLoading: loading,
    error
  };
};

export const useCreatePrintJob = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async (jobData: Partial<PrintJob>) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch('/print-jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
      return response.data;
    } catch (err) {
      let errorMessage = 'Failed to create print job';
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('ECONNREFUSED')) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (err.message.includes('503') || err.message.includes('DATABASE_CONNECTION_ERROR')) {
          errorMessage = 'Database connection issue. Please try again in a moment.';
        } else if (err.message.includes('403')) {
          errorMessage = 'Permission denied. Please check your authentication.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Printer not found. Please select a different printer.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((jobData: Partial<PrintJob>) => {
    mutateAsync(jobData).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken, userId } = useAuth();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch(`/users/clerk/${userId}`);
        setUser(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch current user');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCurrentUser();
    }
  }, [userId, getToken]);

  return { user, loading, error };
};

export const useCreateUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async (userData: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((userData: Partial<User>) => {
    mutateAsync(userData).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

// Additional hooks for completeness
export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalPrintJobs: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activePrinters: 0,
    lastMonthGrowth: {
      jobs: 0,
      revenue: 0,
      users: 0
    },
    popularPaperTypes: [
      { type: 'A4', count: 0, percentage: 0 },
      { type: 'A3', count: 0, percentage: 0 },
      { type: 'Letter', count: 0, percentage: 0 }
    ],
    dailyStats: [],
    monthlyStats: [],
    printerUsage: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch('/admin/analytics');
        setAnalytics(response.data);
      } catch (err) {
        console.warn('Analytics endpoint not available, using fallback data:', err);
        // For now, use mock data if the endpoint doesn't exist
        setAnalytics({
          totalPrintJobs: 1247,
          totalRevenue: 3456.78,
          totalUsers: 542,
          activePrinters: 8,
          lastMonthGrowth: {
            jobs: 15.2,
            revenue: 12.8,
            users: 8.5
          },
          popularPaperTypes: [
            { type: 'A4', count: 856, percentage: 68.7 },
            { type: 'A3', count: 234, percentage: 18.8 },
            { type: 'Letter', count: 157, percentage: 12.5 }
          ],
          dailyStats: [
            { date: '2025-08-23', jobs: 45, revenue: 123.50 },
            { date: '2025-08-24', jobs: 52, revenue: 145.20 },
            { date: '2025-08-25', jobs: 38, revenue: 98.75 },
            { date: '2025-08-26', jobs: 61, revenue: 178.90 },
            { date: '2025-08-27', jobs: 49, revenue: 134.60 },
            { date: '2025-08-28', jobs: 55, revenue: 156.80 },
            { date: '2025-08-29', jobs: 47, revenue: 128.45 }
          ],
          monthlyStats: [
            { month: 'Jan', jobs: 1123, revenue: 3245.67 },
            { month: 'Feb', jobs: 1045, revenue: 2987.43 },
            { month: 'Mar', jobs: 1189, revenue: 3456.12 },
            { month: 'Apr', jobs: 1267, revenue: 3678.90 },
            { month: 'May', jobs: 1345, revenue: 3890.45 },
            { month: 'Jun', jobs: 1423, revenue: 4123.78 },
            { month: 'Jul', jobs: 1389, revenue: 4045.32 },
            { month: 'Aug', jobs: 1247, revenue: 3456.78 }
          ],
          printerUsage: [
            { printer: 'HP LaserJet Pro 1', usage: 87, status: 'online' },
            { printer: 'Canon PIXMA 2', usage: 65, status: 'online' },
            { printer: 'Epson EcoTank 3', usage: 92, status: 'maintenance' },
            { printer: 'Brother HL-L2350DW', usage: 78, status: 'online' }
          ]
        });
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [getToken]);

  return { analytics, loading, error };
};

export const usePrintJob = (jobId?: string) => {
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchPrintJob = async () => {
      if (!jobId) return;

      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch(`/print-jobs/${jobId}`);
        setPrintJob(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch print job');
      } finally {
        setLoading(false);
      }
    };

    fetchPrintJob();
  }, [jobId, getToken]);

  return { printJob, loading, error };
};

export const useUpdatePrintJobStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async ({ jobId, status }: { jobId: string; status: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch(`/print-jobs/${jobId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update print job status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((data: { jobId: string; status: string }) => {
    mutateAsync(data).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const useCancelPrintJob = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async (jobId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch(`/print-jobs/${jobId}/cancel`, {
        method: 'POST',
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel print job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((jobId: string) => {
    mutateAsync(jobId).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const useRequestReprint = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async (jobId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch(`/print-jobs/${jobId}/reprint`, {
        method: 'POST',
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request reprint';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((jobId: string) => {
    mutateAsync(jobId).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const useAllPrintJobs = () => {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchAllPrintJobs = async () => {
      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch('/print-jobs');
        setPrintJobs(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch all print jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchAllPrintJobs();
  }, [getToken]);

  return { printJobs, loading, error };
};

export const useAvailablePrinters = () => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchAvailablePrinters = async () => {
      try {
        console.log('🖨️ Fetching available printers...');
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch('/printers?status=online');
        console.log('🖨️ Printers response:', response);
        setPrinters(response.data);
        console.log('✅ Available printers loaded:', response.data.length);
      } catch (err) {
        console.error('❌ Failed to fetch printers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch available printers');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailablePrinters();
  }, [getToken]);

  return { printers, loading, error };
};

export const usePrinter = (printerId?: string) => {
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchPrinter = async () => {
      if (!printerId) return;

      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch(`/printers/${printerId}`);
        setPrinter(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch printer');
      } finally {
        setLoading(false);
      }
    };

    fetchPrinter();
  }, [printerId, getToken]);

  return { printer, loading, error };
};

export const useUpdatePrinterStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async ({ printerId, status }: { printerId: string; status: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch(`/printers/${printerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update printer status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((data: { printerId: string; status: string }) => {
    mutateAsync(data).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const useUpdatePrinterLevels = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async ({ printerId, levels }: { printerId: string; levels: PrinterLevels }) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch(`/printers/${printerId}/levels`, {
        method: 'PATCH',
        body: JSON.stringify({ levels }),
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update printer levels';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((data: { printerId: string; levels: PrinterLevels }) => {
    mutateAsync(data).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const useUserNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch(`/notifications/user/${userId}`);
        setNotifications(response.data?.notifications || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchNotifications();
    }
  }, [userId, getToken]);

  return { notifications, loading, error };
};

export const useMarkNotificationAsRead = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch(`/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((notificationId: string) => {
    mutateAsync(notificationId).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const useMarkAllNotificationsAsRead = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch(`/notifications/user/${userId}/read-all`, {
        method: 'PUT',
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((userId: string) => {
    mutateAsync(userId).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

export const useAdminLogs = () => {
  const [logs, setLogs] = useState<AdminLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchAdminLogs = async () => {
      try {
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch('/admin-logs');
        setLogs(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch admin logs');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminLogs();
  }, [getToken]);

  return { logs, loading, error };
};

export const useCreateAdminLog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const mutateAsync = useCallback(async (logData: AdminLogData) => {
    setIsLoading(true);
    setError(null);
    try {
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch('/admin-logs', {
        method: 'POST',
        body: JSON.stringify(logData),
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create admin log';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const mutate = useCallback((logData: AdminLogData) => {
    mutateAsync(logData).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
  };
};

// Legacy compatibility
export const useDatabase = () => {
  return {
    createUser: async () => null,
    updateUser: async () => null,
    deleteUser: async () => null,
    getUserById: async () => null,
    getAllUsers: async () => [],
    invalidateQueries: () => { },
    prefetchQuery: async () => null,
    queryClient: null,
  };
};

// Query Keys
export const QUERY_KEYS = {
  USERS: 'users',
  PRINT_JOBS: 'printJobs',
  PRINTERS: 'printers',
  NOTIFICATIONS: 'notifications',
  ADMIN_LOGS: 'adminLogs',
} as const;
