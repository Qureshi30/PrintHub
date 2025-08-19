import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Printer,
  FileText,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "failure" | "refund" | "printer_down" | "scheduled" | "warning";
  title: string;
  message: string;
  jobId?: string;
  amount?: number;
  timestamp: string;
  isRead: boolean;
  actionRequired?: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Print Job Completed",
    message: "Your document 'Assignment_Final.pdf' has been printed successfully. Please collect from Library Ground Floor.",
    jobId: "PJ-2024-001",
    timestamp: "2024-01-15T14:30:00Z",
    isRead: false,
    actionRequired: false
  },
  {
    id: "2",
    type: "failure",
    title: "Print Job Failed",
    message: "Your print job 'Report_Draft.docx' failed due to printer malfunction. A refund has been initiated.",
    jobId: "PJ-2024-002",
    amount: 2.50,
    timestamp: "2024-01-15T13:45:00Z",
    isRead: false,
    actionRequired: false
  },
  {
    id: "3",
    type: "refund",
    title: "Refund Processed",
    message: "Refund of ₹2.50 for failed print job has been credited to your account within 3-5 business days.",
    jobId: "PJ-2024-002",
    amount: 2.50,
    timestamp: "2024-01-15T13:50:00Z",
    isRead: true,
    actionRequired: false
  },
  {
    id: "4",
    type: "printer_down",
    title: "Printer Maintenance",
    message: "Library Ground Floor printer is temporarily down for maintenance. Your scheduled job has been moved to Computer Lab 1.",
    jobId: "PJ-2024-003",
    timestamp: "2024-01-15T12:15:00Z",
    isRead: false,
    actionRequired: true
  },
  {
    id: "5",
    type: "scheduled",
    title: "Scheduled Print Reminder",
    message: "Your scheduled print job for 'Presentation_Final.pptx' is ready to start at 3:00 PM today.",
    jobId: "PJ-2024-004",
    timestamp: "2024-01-15T14:45:00Z",
    isRead: true,
    actionRequired: false
  },
  {
    id: "6",
    type: "warning",
    title: "Special Paper Required",
    message: "Your A3 print job requires manual paper loading. Estimated delay: 15-30 minutes.",
    jobId: "PJ-2024-005",
    timestamp: "2024-01-15T11:20:00Z",
    isRead: false,
    actionRequired: false
  }
];

export default function Notifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "action_required">("all");

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failure": return <XCircle className="h-5 w-5 text-red-500" />;
      case "refund": return <DollarSign className="h-5 w-5 text-blue-500" />;
      case "printer_down": return <Printer className="h-5 w-5 text-orange-500" />;
      case "scheduled": return <Clock className="h-5 w-5 text-purple-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>;
      case "failure": return <Badge variant="destructive">Failed</Badge>;
      case "refund": return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Refund</Badge>;
      case "printer_down": return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Maintenance</Badge>;
      case "scheduled": return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Scheduled</Badge>;
      case "warning": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default: return <Badge variant="outline">Info</Badge>;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    toast({
      title: "All notifications marked as read",
      description: "Your notification list has been updated.",
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast({
      title: "All notifications cleared",
      description: "Your notification list is now empty.",
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case "unread": return !notif.isRead;
      case "action_required": return notif.actionRequired;
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired).length;

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your print job status and system alerts
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === "action_required" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("action_required")}
          >
            Action Required ({actionRequiredCount})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-center">
                  {filter === "all" 
                    ? "You're all caught up! No notifications to show."
                    : `No ${filter.replace("_", " ")} notifications found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-all hover:shadow-md cursor-pointer ${
                  !notification.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""
                } ${notification.actionRequired ? "border-orange-200 bg-orange-50/30" : ""}`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{notification.title}</h3>
                          {getNotificationBadge(notification.type)}
                          {notification.actionRequired && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatTimestamp(notification.timestamp)}</span>
                          {notification.jobId && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {notification.jobId}
                            </span>
                          )}
                          {notification.amount && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ₹{notification.amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
