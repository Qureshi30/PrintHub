import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '@/lib/apiClient';

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
  metadata?: {
    category?: string;
    queryId?: string;
    newStatus?: string;
    [key: string]: unknown;
  };
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
  id?: string;
  clerkUserId: string;
  role: 'student' | 'admin' | 'staff';
  profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  // Enhanced fields from backend
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
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
  cost?: {
    baseCost: number;
    colorCost: number;
    paperCost: number;
    totalCost: number;
  };
  pricing?: {
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
  queueLength?: number; // Actual queue count from Queue collection
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

// HTTP Client with auth - uses apiClient which includes ngrok headers
const createAuthenticatedFetch = (getToken: () => Promise<string | null>) => {
  return async (url: string, options: RequestInit = {}) => {
    const token = await getToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Use apiClient instead of fetch to get ngrok headers automatically
    const response = await apiClient.request({
      url,
      method: (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      headers,
      data: options.body ? JSON.parse(options.body as string) : undefined,
    });

    return response.data;
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

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const authFetch = createAuthenticatedFetch(getToken);
      const response = await authFetch('/students/dashboard-stats');

      console.log('📊 Dashboard stats received:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('❌ Dashboard stats error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [userId, getToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Return refresh function for manual updates
  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh };
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { getToken } = useAuth();

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchPrintJobs = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const authFetch = createAuthenticatedFetch(getToken);
        const url = `/students/print-jobs`;
        const response = await authFetch(url);
        
        // Backend returns: { success: true, data: [...printJobs] }
        const jobs = response.data || [];
        console.log('🔄 useUserPrintJobs - Fetched jobs:', jobs.length);
        setPrintJobs(Array.isArray(jobs) ? jobs : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch print jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchPrintJobs();
  }, [userId, getToken, refreshTrigger]);

  return {
    data: printJobs,
    printJobs,
    loading,
    isLoading: loading,
    error,
    refresh
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
    popularPaperTypes: [] as { type: string; count: number; percentage: number }[],
    dailyStats: [] as { date: string; jobs: number; revenue: number }[],
    monthlyStats: [] as { month: string; jobs: number; revenue: number }[],
    printerUsage: [] as { printer: string; usage: number; status: string; jobCount?: number }[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const authFetch = createAuthenticatedFetch(getToken);
        const response = await authFetch('/admin/analytics');
        
        if (response.success && response.data) {
          setAnalytics({
            totalPrintJobs: response.data.totalPrintJobs || 0,
            totalRevenue: response.data.totalRevenue || 0,
            totalUsers: response.data.totalUsers || 0,
            activePrinters: response.data.activePrinters || 0,
            lastMonthGrowth: response.data.lastMonthGrowth || {
              jobs: 0,
              revenue: 0,
              users: 0
            },
            popularPaperTypes: response.data.popularPaperTypes || [],
            dailyStats: response.data.dailyStats || [],
            monthlyStats: response.data.monthlyStats || [],
            printerUsage: response.data.printerUsage || []
          });
          setError(null);
        } else {
          throw new Error('Invalid response format from analytics endpoint');
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        // Don't set fallback mock data - keep zeros to show there's an issue
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
