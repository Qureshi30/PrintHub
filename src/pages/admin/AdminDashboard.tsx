import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/apiClient";
import { useAdminStats } from "@/hooks/useDatabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { AdminMobileSidebar } from "@/components/admin/AdminMobileSidebar";
import { 
  Users, 
  Printer, 
  FileText, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentErrors, setRecentErrors] = useState<Array<{
    _id: string;
    printerName: string;
    errorType: string;
    description: string;
    status: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    timestamp: string;
    metadata?: { location?: string };
  }>>([]);
  const [errorsLoading, setErrorsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { stats, loading, error } = useAdminStats();

  // Fetch recent printer errors
  useEffect(() => {
    const fetchRecentErrors = async () => {
      try {
        const token = await getToken();
        const response = await apiClient.get('/printer-errors/recent-activity', {
          params: { limit: 10 },
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data.success) {
          setRecentErrors(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching recent errors:', error);
      } finally {
        setErrorsLoading(false);
      }
    };

    fetchRecentErrors();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentErrors, 30000);
    return () => clearInterval(interval);
  }, [getToken]);

  // Default stats to prevent errors
  const defaultStats = {
    totalUsers: 0,
    totalPrintJobs: 0,
    totalRevenue: 0,
    activePrinters: 0,
    activeStudents: 0,
    printJobsToday: 0,
    revenueToday: 0,
    totalPrinters: 0,
    maintenancePrinters: 0,
  };

  const displayStats = stats || defaultStats;

  // Helper function to format time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">Error loading dashboard: {error}</p>
            <Button onClick={() => globalThis.location.reload()} className="mt-2">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <AdminMobileSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
        
        <AdminMobileHeader 
          title="Admin Dashboard"
          subtitle="Manage PrintHub system and monitor operations"
          onMenuClick={() => setIsSidebarOpen(true)}
          rightAction={
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Admin Portal
            </Badge>
          }
        />
        
        <div className="p-4 pb-20 space-y-4">
          {/* Quick Stats */}
          <div className="grid gap-4 grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayStats.activeStudents.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Registered students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Print Jobs Today</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayStats.printJobsToday}</div>
                <p className="text-xs text-muted-foreground">Jobs processed today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{displayStats.revenueToday.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Revenue today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Printers</CardTitle>
                <Printer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayStats.activePrinters}/{displayStats.totalPrinters}</div>
                <p className="text-xs text-muted-foreground">{displayStats.maintenancePrinters} under maintenance</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions */}
          <div className="grid gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/users')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage student accounts, permissions, and access controls
                </p>
                <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/admin/users'); }}>
                  Manage Users
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/printers')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Printer Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitor printer status, configure settings, and manage queues
                </p>
                <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/admin/printers'); }}>
                  Manage Printers
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/analytics')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics & Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View detailed analytics and generate comprehensive reports
                </p>
                <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/admin/analytics'); }}>
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.activeStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Print Jobs Today</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.printJobsToday}</div>
            <p className="text-xs text-muted-foreground">Jobs processed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{displayStats.revenueToday.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Revenue today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Printers</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.activePrinters}/{displayStats.totalPrinters}</div>
            <p className="text-xs text-muted-foreground">{displayStats.maintenancePrinters} under maintenance</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/users')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage student accounts, permissions, and access controls
            </p>
            <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/admin/users'); }}>
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/printers')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Printer Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor printer status, configure settings, and manage queues
            </p>
            <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/admin/printers'); }}>
              Manage Printers
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View detailed analytics, generate reports, and track usage
            </p>
            <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/admin/analytics'); }}>
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent System Activity</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/error-logs')}
            className="text-blue-600 hover:text-blue-700"
          >
            View All Errors
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {errorsLoading && (
            <div className="text-center py-4 text-muted-foreground">
              Loading recent activity...
            </div>
          )}
          
          {!errorsLoading && recentErrors.length === 0 && (
            <div className="text-center py-4 text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p>No active system alerts</p>
              <p className="text-xs">All systems operational</p>
            </div>
          )}
          
          {!errorsLoading && recentErrors.length > 0 && (
            <div className="space-y-3">
              {recentErrors.slice(0, 5).map((error) => {
                const priorityConfig = {
                  urgent: { bg: 'bg-red-50 dark:bg-red-950/30', dot: 'bg-red-500 dark:bg-red-400', text: 'text-red-800 dark:text-red-200', icon: AlertCircle },
                  high: { bg: 'bg-orange-50 dark:bg-orange-950/30', dot: 'bg-orange-500 dark:bg-orange-400', text: 'text-orange-800 dark:text-orange-200', icon: AlertTriangle },
                  medium: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', dot: 'bg-yellow-500 dark:bg-yellow-400', text: 'text-yellow-800 dark:text-yellow-200', icon: AlertTriangle },
                  low: { bg: 'bg-blue-50 dark:bg-blue-950/30', dot: 'bg-blue-500 dark:bg-blue-400', text: 'text-blue-800 dark:text-blue-200', icon: Info }
                };
                
                const config = priorityConfig[error.priority];
                const Icon = config.icon;
                const timeAgo = getTimeAgo(error.timestamp);
                
                // Badge for status
                const statusBadge = error.status === 'unresolved' ? 
                  <Badge className="bg-red-100 text-red-800 text-xs">Unresolved</Badge> : 
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">In Progress</Badge>;
                
                return (
                  <div key={error._id} className={`flex items-start justify-between p-3 ${config.bg} rounded-lg`}>
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`h-4 w-4 ${config.text} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${config.text}`}>
                            {error.errorType}: {error.printerName}
                          </p>
                          {statusBadge}
                        </div>
                        <p className={`text-xs ${config.text} opacity-80 mt-0.5`}>{error.description}</p>
                        {error.metadata?.location && (
                          <p className={`text-xs ${config.text} opacity-60 mt-1`}>
                            📍 {error.metadata.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{timeAgo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
