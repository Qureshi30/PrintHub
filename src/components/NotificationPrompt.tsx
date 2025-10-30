import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, X } from 'lucide-react';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { socketService } from '@/services/socketService';

export function NotificationPrompt() {
  const { isSignedIn } = useAuth();
  const { permission, requestPermission, isSupported } = useBrowserNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Check socket connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = socketService.isConnected();
      setIsConnected(connected);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if user dismissed the prompt before
    const hasSessionPrompted = sessionStorage.getItem('notificationPromptShown');
    const hasPersistentlyDismissed = localStorage.getItem('notificationPromptDismissed');

    if (
      isSignedIn &&
      isSupported &&
      permission === 'default' &&
      !hasSessionPrompted &&
      !hasPersistentlyDismissed &&
      !dismissed
    ) {
      // Show prompt after 3 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
        sessionStorage.setItem('notificationPromptShown', 'true');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSignedIn, isSupported, permission, dismissed]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
  };

  const handleDismissForever = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  if (!showPrompt || !isSignedIn || !isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500">
      <Card className="w-80 shadow-xl border-2 border-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Enable Notifications</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Get instant updates when your print jobs are completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Print job completion alerts</li>
              <li>Payment approval notifications</li>
              <li>Real-time status updates</li>
            </ul>
          </div>
          
          {isConnected && (
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Connected to real-time updates
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleEnableNotifications}
              className="flex-1"
              size="sm"
            >
              <Bell className="h-4 w-4 mr-1" />
              Enable
            </Button>
            <Button
              onClick={handleDismissForever}
              variant="ghost"
              size="sm"
              className="flex-1"
            >
              <BellOff className="h-4 w-4 mr-1" />
              No Thanks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
