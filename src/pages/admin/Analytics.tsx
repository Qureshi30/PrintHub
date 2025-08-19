import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface AnalyticsData {
  metric: string;
  value: string;
  change: number;
  period: string;
}

const analyticsData: AnalyticsData[] = [
  { metric: "Total Print Jobs", value: "15,234", change: 12.5, period: "vs last month" },
  { metric: "Revenue", value: "$8,947", change: 8.2, period: "vs last month" },
  { metric: "Active Users", value: "1,156", change: -2.1, period: "vs last month" },
  { metric: "Avg Jobs/User", value: "13.2", change: 15.3, period: "vs last month" }
];

interface TopUser {
  name: string;
  department: string;
  jobs: number;
  spent: number;
}

const topUsers: TopUser[] = [
  { name: "John Doe", department: "Computer Science", jobs: 127, spent: 63.50 },
  { name: "Jane Smith", department: "Engineering", jobs: 98, spent: 49.00 },
  { name: "Mike Johnson", department: "Library Staff", jobs: 89, spent: 44.50 },
  { name: "Sarah Wilson", department: "Mathematics", jobs: 76, spent: 38.00 },
  { name: "David Brown", department: "Physics", jobs: 65, spent: 32.50 }
];

interface PrinterUsage {
  name: string;
  location: string;
  jobs: number;
  utilization: number;
}

const printerUsage: PrinterUsage[] = [
  { name: "Library Main", location: "Library Floor 1", jobs: 3247, utilization: 87 },
  { name: "Engineering", location: "Engineering 204", jobs: 2156, utilization: 72 },
  { name: "Student Center", location: "Student Center L2", jobs: 1890, utilization: 65 },
  { name: "Computer Lab A", location: "CS Building", jobs: 1245, utilization: 45 }
];

export default function Analytics() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into printing system usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        {analyticsData.map((item) => (
          <Card key={item.metric}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
              {item.metric.includes("Jobs") && <FileText className="h-4 w-4 text-muted-foreground" />}
              {item.metric.includes("Revenue") && <DollarSign className="h-4 w-4 text-muted-foreground" />}
              {item.metric.includes("Users") && <Users className="h-4 w-4 text-muted-foreground" />}
              {item.metric.includes("Avg") && <BarChart3 className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {item.change > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={item.change > 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(item.change)}%
                </span>
                <span className="ml-1">{item.period}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock chart placeholder */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Weekly Print Jobs Chart</p>
                  <p className="text-sm text-gray-400">Chart component would go here</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">2,847</div>
                  <div className="text-xs text-muted-foreground">This Week</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">2,534</div>
                  <div className="text-xs text-muted-foreground">Last Week</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">+12.3%</div>
                  <div className="text-xs text-muted-foreground">Growth</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Department Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock pie chart placeholder */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Department Distribution Chart</p>
                  <p className="text-sm text-gray-400">Chart component would go here</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Computer Science</span>
                  <span className="text-sm font-medium">32%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Engineering</span>
                  <span className="text-sm font-medium">28%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mathematics</span>
                  <span className="text-sm font-medium">18%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Others</span>
                  <span className="text-sm font-medium">22%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Users This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topUsers.map((user, index) => (
              <div key={user.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.department}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{user.jobs} jobs</div>
                  <div className="text-sm text-muted-foreground">${user.spent.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Printer Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printer Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {printerUsage.map((printer) => (
              <div key={printer.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{printer.name}</div>
                  <div className="text-sm text-muted-foreground">{printer.location}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{printer.jobs.toLocaleString()} jobs</div>
                    <div className="text-sm text-muted-foreground">This month</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${printer.utilization}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12">{printer.utilization}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Daily Usage Report</div>
                <div className="text-sm text-muted-foreground">Print jobs and revenue by day</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">User Activity Report</div>
                <div className="text-sm text-muted-foreground">Top users and department breakdown</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Printer Performance</div>
                <div className="text-sm text-muted-foreground">Utilization and maintenance logs</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
