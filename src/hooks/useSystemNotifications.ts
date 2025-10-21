import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@clerk/clerk-react';

export interface SystemNotification {
  _id: string;
  type: 'maintenance' | 'system' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  clerkUserId: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    printerId?: {
      _id: string;
      name: string;
      location: string;
    };
    errorCode?: string;
    severity?: string;
  };
}

export function useSystemNotifications(autoRefresh = true, intervalMs = 30000) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchSystemNotifications = async () => {
    try {
      const token = await getToken();
      const response = await apiClient.get('/notifications/system', {
        params: {
          read: false, // Only fetch unread notifications
          limit: 20
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching system notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = await getToken();
      await apiClient.patch(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await getToken();
      await Promise.all(
        notifications.map(n =>
          apiClient.patch(
            `/notifications/${n._id}/read`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        )
      );
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const refresh = () => {
    setLoading(true);
    fetchSystemNotifications();
  };

  useEffect(() => {
    fetchSystemNotifications();

    if (autoRefresh) {
      const interval = setInterval(fetchSystemNotifications, intervalMs);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, intervalMs]);

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  };
}
