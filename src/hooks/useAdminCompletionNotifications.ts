import { useState } from 'react';

interface PrintJobCompletionData {
  _id: string;
  userName: string;
  userEmail: string;
  file: {
    originalName: string;
  };
  printer: {
    name: string;
    location: string;
  };
  settings: {
    copies: number;
    color: boolean;
    duplex: boolean;
    paperType: string;
  };
  cost: {
    totalCost: number;
  };
  completedAt: string;
  processingTime: number;
}

// Notification Manager Hook
export function useAdminCompletionNotifications() {
  const [notifications, setNotifications] = useState<PrintJobCompletionData[]>([]);

  const addNotification = (jobData: PrintJobCompletionData) => {
    setNotifications(prev => [...prev, jobData]);
    
    // Play notification sound (optional)
    if ('Audio' in window) {
      try {
        const audio = new Audio('/notification-success.mp3');
        audio.volume = 0.3;
        audio.play().catch((playError) => {
          // Ignore audio play errors (user might not have interacted with page yet)
          console.debug('Audio notification could not play:', playError);
        });
      } catch (audioError) {
        // Ignore audio creation errors
        console.debug('Audio notification not available:', audioError);
      }
    }
  };

  const removeNotification = (jobId: string) => {
    setNotifications(prev => prev.filter(notification => notification._id !== jobId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
}

export type { PrintJobCompletionData };