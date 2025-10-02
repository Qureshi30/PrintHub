import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAnalytics } from "@/hooks/useDatabase";
import { 
  DollarSign, 
  FileText, 
  Users, 
  Printer,
  BarChart3,
  Activity
} from "lucide-react";

export default function Analytics() {
  const { analytics, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading analytics...</p>
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
            <p className="text-red-600">Error loading analytics: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const analyticsData = [
    { 
      metric: "Total Print Jobs", 
      value: analytics.totalPrintJobs.toLocaleString(),
      icon: FileText,
      description: "Completed jobs"
    },
    { 
      metric: "Revenue", 
      value: `₹${analytics.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total revenue"
    },
    { 
      metric: "Total Users", 
      value: analytics.totalUsers.toLocaleString(),
      icon: Users,
      description: "Registered users"
    },
    { 
      metric: "Active Printers", 
      value: analytics.activePrinters.toString(),
      icon: Printer,
      description: "Online printers"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Detailed insights and performance metrics
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {analyticsData.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card key={item.metric}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Printer Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Printer Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.printerUsage.map((printer) => (
              <div key={printer.printer} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{printer.printer}</p>
                    <p className="text-sm text-muted-foreground">Status: {printer.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{printer.usage}% usage</p>
                    <p className="text-sm text-muted-foreground">Utilization</p>
                  </div>
                </div>
                <Progress value={printer.usage} className="h-2" />
              </div>
            ))}
            
            {analytics.printerUsage.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No printer data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chart visualization would appear here</p>
                <p className="text-sm">Integration with charting library needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Print Job Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Completed</span>
                <span className="font-medium">
                  {analytics.totalPrintJobs} jobs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-medium text-green-600">
                  ₹{analytics.totalRevenue.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Users</span>
                <span className="font-medium">{analytics.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Jobs per User</span>
                <span className="font-medium">{analytics.totalUsers > 0 ? (analytics.totalPrintJobs / analytics.totalUsers).toFixed(1) : '0.0'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Revenue</span>
                <span className="font-medium">₹{analytics.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg per Job</span>
                <span className="font-medium">
                  ₹{analytics.totalPrintJobs > 0 ? (analytics.totalRevenue / analytics.totalPrintJobs).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
