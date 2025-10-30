import { useSocketNotifications } from '@/hooks/useSocketNotifications';

/**
 * Component that initializes Socket.IO notifications
 * Must be placed inside Router context but stays mounted throughout the app
 */
export function SocketNotificationProvider() {
  // Initialize socket notifications
  useSocketNotifications();
  
  // This component doesn't render anything
  return null;
}
