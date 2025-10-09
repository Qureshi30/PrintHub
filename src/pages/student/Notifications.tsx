import { useState } from "react";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";
import { useUserNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/hooks/useDatabase";
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Printer,
  FileText,
  RefreshCw
} from "lucide-react";

export default function Notifications() {
  const { toast } = useToast();
  const { userId } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread" | "action_required">("all");
  
  // Use hooks with user ID
  const { notifications, loading: isLoading, error } = useUserNotifications(userId || undefined);
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read.",
    });
  };

  const handleMarkAllAsRead = () => {
    if (userId) {
      markAllAsReadMutation.mutate(userId);
      toast({
        title: "All notifications marked as read",
        description: "All notifications have been marked as read.",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_completed": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "job_failed": return <XCircle className="h-5 w-5 text-red-500" />;
      case "job_queued": return <Clock className="h-5 w-5 text-blue-500" />;
      case "printer_maintenance": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "low_ink": return <Printer className="h-5 w-5 text-orange-500" />;
      case "print_ready": return <FileText className="h-5 w-5 text-green-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "job_completed": return <Badge variant="outline">Completed</Badge>;
      case "job_failed": return <Badge variant="destructive">Failed</Badge>;
      case "job_queued": return <Badge variant="secondary">Queued</Badge>;
      case "printer_maintenance": return <Badge variant="outline">Maintenance</Badge>;
      case "low_ink": return <Badge variant="outline">Low Supplies</Badge>;
      case "print_ready": return <Badge variant="outline">Ready</Badge>;
      default: return <Badge variant="outline">Info</Badge>;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "unread") return !notification.read;
    if (filter === "action_required") return notification.actionRequired;
    return true;
  });

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <XCircle className="h-12 w-12 mx-auto mb-4" />
                <p>Failed to load notifications. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MobileSidebar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your print jobs and system alerts
          </p>
        </div>

        {/* Filter and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Unread
            </Button>
            <Button
              variant={filter === "action_required" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("action_required")}
            >
              Action Required
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isLoading}
          >
            {markAllAsReadMutation.isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Mark All Read
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications to display</p>
                  <p className="text-sm mt-2">You're all caught up!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification._id} 
                className={`transition-all duration-200 hover:shadow-md ${
                  !notification.read ? 'border-blue-200 bg-blue-50/50' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {getNotificationBadge(notification.type)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(notification._id)}
                              disabled={markAsReadMutation.isLoading}
                            >
                              {markAsReadMutation.isLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination placeholder */}
        {filteredNotifications.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredNotifications.length} notifications
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
