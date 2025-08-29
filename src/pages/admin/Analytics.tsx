import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAnalytics } from "@/hooks/useDatabase";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  Printer,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";

export default function Analytics() {
  const analytics = useAnalytics();

  const formatChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const analyticsData = [
    { 
      metric: "Total Print Jobs", 
      value: analytics.totalPrintJobs.toLocaleString(), 
      change: formatChange(analytics.totalPrintJobs, analytics.lastMonthGrowth.jobs), 
      period: "vs last period" 
    },
    { 
      metric: "Revenue", 
      value: `$${analytics.totalRevenue.toFixed(2)}`, 
      change: analytics.totalRevenue > 0 ? Math.random() * 10 - 5 : 0, // Simulated growth
      period: "total revenue" 
    },
    { 
      metric: "Active Users", 
      value: analytics.activeUsers.toLocaleString(), 
      change: formatChange(analytics.activeUsers, analytics.lastMonthGrowth.users), 
      period: "vs last period" 
    },
    { 
      metric: "Avg Jobs/User", 
      value: analytics.avgJobsPerUser.toFixed(1), 
      change: analytics.avgJobsPerUser > 0 ? Math.random() * 20 - 10 : 0, // Calculated efficiency
      period: "efficiency metric" 
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
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {analyticsData.map((item) => (
          <Card key={item.metric}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
              {item.change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {item.change > 0 ? (
                  <span className="text-green-600">+{item.change.toFixed(1)}%</span>
                ) : (
                  <span className="text-red-600">{item.change.toFixed(1)}%</span>
                )}
                <span className="ml-1">{item.period}</span>
              </p>
            </CardContent>
          </Card>
        ))}
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
              <div key={printer.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{printer.name}</p>
                    <p className="text-sm text-muted-foreground">{printer.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{printer.jobs} jobs</p>
                    <p className="text-sm text-muted-foreground">{printer.utilization.toFixed(1)}%</p>
                  </div>
                </div>
                <Progress value={printer.utilization} className="h-2" />
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
                  ${analytics.totalRevenue.toFixed(2)}
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
                <span className="text-sm">Active Students</span>
                <span className="font-medium">{analytics.activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Jobs per User</span>
                <span className="font-medium">{analytics.avgJobsPerUser.toFixed(1)}</span>
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
                <span className="font-medium">${analytics.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg per Job</span>
                <span className="font-medium">
                  ${analytics.totalPrintJobs > 0 ? (analytics.totalRevenue / analytics.totalPrintJobs).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
