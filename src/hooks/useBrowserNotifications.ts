import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support notifications.',
        variant: 'destructive'
      });
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will receive browser notifications for print job updates.',
        });
        return true;
      } else {
        toast({
          title: 'Permission Denied',
          description: 'You can enable notifications in your browser settings.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, permission, toast]);

  const showNotification = useCallback((options: BrowserNotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted or not supported');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo.png',
        tag: options.tag || 'printhub-notification',
        badge: '/logo.png',
        requireInteraction: options.requireInteraction || false,
        data: options.data,
        silent: false,
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navigate based on notification type
        const data = options.data;
        if (data?.type === 'print_job_completed' || data?.type === 'print_job_failed') {
          navigate('/student/print-history');
        } else if (data?.type === 'cash_payment_approved') {
          navigate('/student/payment-history');
        } else if (data?.jobId) {
          navigate(`/student/print-history`);
        }
        
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission, navigate]);

  const showPrintJobCompleted = useCallback((jobData: {
    jobId: string;
    fileName: string;
    printerName: string;
    completedAt: string;
  }) => {
    return showNotification({
      title: '✅ Print Job Completed',
      body: `Your print job "${jobData.fileName}" has been completed on ${jobData.printerName}.`,
      icon: '/printer-icon.png',
      tag: `print-job-${jobData.jobId}`,
      requireInteraction: false,
      data: {
        type: 'print_job_completed',
        jobId: jobData.jobId,
        ...jobData
      }
    });
  }, [showNotification]);

  const showPrintJobFailed = useCallback((jobData: {
    jobId: string;
    fileName: string;
    printerName: string;
    error: string;
  }) => {
    return showNotification({
      title: '❌ Print Job Failed',
      body: `Your print job "${jobData.fileName}" failed: ${jobData.error}`,
      icon: '/printer-icon.png',
      tag: `print-job-${jobData.jobId}`,
      requireInteraction: true,
      data: {
        type: 'print_job_failed',
        jobId: jobData.jobId,
        ...jobData
      }
    });
  }, [showNotification]);

  const showPrintJobTerminated = useCallback((jobData: {
    jobId: string;
    fileName: string;
    printerName: string;
  }) => {
    return showNotification({
      title: '🛑 Print Job Terminated',
      body: `Your print job "${jobData.fileName}" was terminated.`,
      icon: '/printer-icon.png',
      tag: `print-job-${jobData.jobId}`,
      requireInteraction: false,
      data: {
        type: 'print_job_terminated',
        jobId: jobData.jobId,
        ...jobData
      }
    });
  }, [showNotification]);

  const showCashPaymentApproved = useCallback((paymentData: {
    requestId: string;
    amount: number;
    jobId?: string;
  }) => {
    return showNotification({
      title: '💰 Cash Payment Approved',
      body: `Your cash payment of ₹${paymentData.amount} has been approved.`,
      icon: '/payment-icon.png',
      tag: `cash-payment-${paymentData.requestId}`,
      requireInteraction: false,
      data: {
        type: 'cash_payment_approved',
        requestId: paymentData.requestId,
        ...paymentData
      }
    });
  }, [showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showPrintJobCompleted,
    showPrintJobFailed,
    showPrintJobTerminated,
    showCashPaymentApproved
  };
}
