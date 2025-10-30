import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/hooks/useDatabase";
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Printer,
  FileText,
  RefreshCw,
  ExternalLink,
  MessageCircle
} from "lucide-react";

export default function Notifications() {
  const { toast } = useToast();
  const { userId, getToken } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread" | "action_required">("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);

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

  const handleNotificationClick = async (notification: any) => {
    console.log('🔔 Notification clicked!', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      metadata: notification.metadata,
      hasQueryId: !!notification.metadata?.queryId
    });

    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }

    // If it's a query notification, fetch and show query details
    if (notification.metadata?.queryId) {
      console.log('📋 Fetching query details for:', notification.metadata.queryId);
      await fetchQueryDetails(notification.metadata.queryId);
    } else if (notification.type === 'system' && notification.metadata?.category) {
      // Navigate to support page
      console.log('🔗 Navigating to support page');
      navigate('/support');
    } else {
      console.log('ℹ️ No queryId found, notification not clickable');
    }
  };

  const fetchQueryDetails = async (queryId: string) => {
    setLoadingQuery(true);
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3001/api/queries/${queryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedQuery(data.data);
        setIsQueryDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to load query details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching query:', error);
      toast({
        title: "Error",
        description: "Failed to load query details",
        variant: "destructive"
      });
    } finally {
      setLoadingQuery(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
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
      {isMobile && (
        <MobileSidebar
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />
      )}
      <MobileHeader
        title="Notifications"
        showBackButton={true}
        backTo="/student/dashboard"
        onMenuClick={() => setIsSidebarOpen(true)}
      />
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
            filteredNotifications.map((notification) => {
              const hasQueryId = notification.metadata?.queryId;
              return (
                <Card
                  key={notification._id}
                  className={`transition-all duration-200 ${hasQueryId ? 'cursor-pointer hover:shadow-lg hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/30' : ''
                    } ${!notification.read ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30' : ''
                    }`}
                  onClick={() => {
                    console.log('🖱️ Notification clicked:', notification._id, 'Has queryId:', hasQueryId);
                    handleNotificationClick(notification);
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">{notification.title}</h3>
                              {hasQueryId && (
                                <div className="flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3 text-blue-500" />
                                  <span className="text-xs text-blue-500">Click to view</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {/* Show View Details button only for resolved query notifications */}
                              {hasQueryId && notification.title.toLowerCase().includes('resolved') ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                              ) : (
                                getNotificationBadge(notification.type)
                              )}
                              {notification.metadata?.category && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.metadata.category}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {hasQueryId && (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                View Ticket
                              </Button>
                            )}
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification._id);
                                }}
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
              );
            })
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

      {/* Query Detail Dialog */}
      <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Support Ticket Details
            </DialogTitle>
            <DialogDescription>
              View your support ticket and admin response
            </DialogDescription>
          </DialogHeader>

          {loadingQuery ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : selectedQuery ? (
            <div className="space-y-4">
              {/* Status and Priority */}
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedQuery.status)}>
                  {selectedQuery.status === 'resolved' && '✅ '}
                  {selectedQuery.status === 'in-progress' && '🔄 '}
                  {selectedQuery.status === 'open' && '🔵 '}
                  {selectedQuery.status === 'closed' && '⚫ '}
                  {selectedQuery.status.toUpperCase()}
                </Badge>
                <Badge className={getPriorityColor(selectedQuery.priority)}>
                  {selectedQuery.priority.toUpperCase()}
                </Badge>
                <Badge variant="outline">{selectedQuery.category}</Badge>
              </div>

              {/* Ticket Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Ticket ID:</span>
                  <span className="text-sm text-muted-foreground">#{selectedQuery._id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Submitted:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedQuery.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedQuery.updatedAt && selectedQuery.updatedAt !== selectedQuery.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Last Updated:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedQuery.updatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Subject</h4>
                <p className="text-sm">{selectedQuery.subject}</p>
              </div>

              {/* Your Message */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded"></span>
                  Your Message
                </h4>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedQuery.message}</p>
                </div>
              </div>

              {/* Admin Response */}
              {selectedQuery.adminResponse && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded"></span>
                    Admin Response
                  </h4>
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedQuery.adminResponse}</p>
                    {selectedQuery.respondedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Responded on {new Date(selectedQuery.respondedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* No Response Yet */}
              {!selectedQuery.adminResponse && selectedQuery.status !== 'closed' && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {selectedQuery.status === 'in-progress'
                        ? 'Our team is working on your ticket. You will receive an email when we respond.'
                        : 'Our support team will respond within 24 hours. You will receive an email notification.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsQueryDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setIsQueryDialogOpen(false);
                    navigate('/support');
                  }}
                >
                  View All Tickets
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Failed to load ticket details</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
