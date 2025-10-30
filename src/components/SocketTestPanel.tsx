import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { socketService } from '@/services/socketService';
import { useAuth } from '@clerk/clerk-react';
import { Bell, Send, TestTube } from 'lucide-react';

export function SocketTestPanel() {
  const { userId } = useAuth();

  const testConnection = () => {
    console.log('🧪 Testing socket connection...');
    console.log('User ID:', userId);
    console.log('Socket connected:', socketService.isConnected());
    console.log('Socket instance:', socketService.getSocket());
  };

  const testPrintJobCompleted = () => {
    console.log('🧪 Manually triggering print-job-completed event...');
    const socket = socketService.getSocket();
    if (socket) {
      // Manually emit to trigger the handler
      socket.emit('test-trigger', {
        event: 'print-job-completed',
        userId: userId
      });
      
      // Also trigger the event locally for testing
      const testData = {
        jobId: 'test-job-123',
        fileName: 'Test Document.pdf',
        printerName: 'Test Printer',
        completedAt: new Date().toISOString(),
        status: 'completed'
      };
      
      // Manually call the socket event
      socket.emit('print-job-completed', testData);
      console.log('📤 Emitted test event:', testData);
    } else {
      console.error('❌ Socket not connected!');
    }
  };

  const requestNotificationPermission = async () => {
    console.log('🧪 Requesting notification permission...');
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);
      if (permission === 'granted') {
        console.log('✅ Notification permission granted!');
        // Test notification
        new Notification('PrintHub', {
          body: 'Notifications enabled! You will now receive print job updates.',
          icon: '/logo.png',
        });
      } else if (permission === 'denied') {
        console.error('❌ Notification permission denied. Please enable in browser settings.');
        alert('Notification permission denied.\n\nTo enable:\n1. Click the 🔒 lock icon in address bar\n2. Find "Notifications"\n3. Change to "Allow"\n4. Refresh the page');
      }
    }
  };

  const testBrowserNotification = () => {
    console.log('🧪 Testing browser notification directly...');
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('PrintHub Test', {
        body: 'This is a test notification',
        icon: '/logo.png',
        tag: 'test-notification'
      });
      console.log('✅ Browser notification sent');
    } else {
      console.error('❌ Notification permission:', Notification.permission);
      if (Notification.permission === 'denied') {
        alert('Notifications are blocked!\n\nTo fix:\n1. Click the 🔒 lock icon in the address bar\n2. Find "Notifications"\n3. Change from "Block" to "Allow"\n4. Refresh this page');
      } else {
        requestNotificationPermission();
      }
    }
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Socket.IO Notification Testing
        </CardTitle>
        <CardDescription>
          Test real-time notifications and Socket.IO connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-2">
          <div><strong>User ID:</strong> {userId || 'Not logged in'}</div>
          <div><strong>Socket Status:</strong> {socketService.isConnected() ? '🟢 Connected' : '🔴 Disconnected'}</div>
          <div>
            <strong>Notification Permission:</strong>{' '}
            {typeof window !== 'undefined' && 'Notification' in window ? (
              <span className={
                Notification.permission === 'granted' ? 'text-green-600 font-semibold' :
                Notification.permission === 'denied' ? 'text-red-600 font-semibold' :
                'text-yellow-600 font-semibold'
              }>
                {Notification.permission === 'granted' ? '✅ Granted' :
                 Notification.permission === 'denied' ? '❌ BLOCKED' :
                 '⚠️ Not Set'}
              </span>
            ) : 'Not supported'}
          </div>
        </div>
        
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
          <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 rounded-lg p-4 text-sm">
            <div className="font-semibold text-red-800 dark:text-red-300 mb-2">⚠️ Notifications are BLOCKED</div>
            <div className="text-red-700 dark:text-red-400 space-y-1">
              <div><strong>To enable notifications:</strong></div>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Click the 🔒 lock icon in your browser's address bar</li>
                <li>Find "Notifications" in the permissions list</li>
                <li>Change from "Block" to "Allow"</li>
                <li>Refresh this page (F5)</li>
              </ol>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 pt-4">
          <Button onClick={testConnection} variant="outline" size="sm">
            <Send className="h-4 w-4 mr-1" />
            Check Connection
          </Button>
          
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
            <Button onClick={requestNotificationPermission} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
              <Bell className="h-4 w-4 mr-1" />
              Enable Notifications
            </Button>
          )}
          
          <Button onClick={testPrintJobCompleted} variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-1" />
            Test Print Job Event
          </Button>
          
          <Button onClick={testBrowserNotification} variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-1" />
            Test Browser Notification
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground pt-4">
          💡 Open browser console (F12) to see detailed logs
        </div>
      </CardContent>
    </Card>
  );
}
