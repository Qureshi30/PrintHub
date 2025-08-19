import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Printer, 
  Plus, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Wrench,
  MapPin
} from "lucide-react";

interface PrinterStatus {
  id: string;
  name: string;
  location: string;
  model: string;
  status: "online" | "offline" | "maintenance" | "error";
  jobsToday: number;
  paperLevel: number;
  tonerLevel: number;
  lastMaintenance: string;
  queueSize: number;
}

const mockPrinters: PrinterStatus[] = [
  {
    id: "1",
    name: "Library Main Floor",
    location: "Library - Floor 1",
    model: "HP LaserJet Pro M404dn",
    status: "online",
    jobsToday: 127,
    paperLevel: 85,
    tonerLevel: 45,
    lastMaintenance: "2024-01-10",
    queueSize: 3
  },
  {
    id: "2",
    name: "Engineering Building",
    location: "Engineering - Room 204",
    model: "Canon imageRUNNER ADVANCE",
    status: "online",
    jobsToday: 89,
    paperLevel: 92,
    tonerLevel: 78,
    lastMaintenance: "2024-01-08",
    queueSize: 7
  },
  {
    id: "3",
    name: "Student Center",
    location: "Student Center - Level 2",
    model: "Xerox VersaLink C405",
    status: "maintenance",
    jobsToday: 0,
    paperLevel: 0,
    tonerLevel: 12,
    lastMaintenance: "2024-01-15",
    queueSize: 0
  },
  {
    id: "4",
    name: "Computer Lab A",
    location: "CS Building - Lab A",
    model: "Brother HL-L6200DW",
    status: "error",
    jobsToday: 45,
    paperLevel: 67,
    tonerLevel: 8,
    lastMaintenance: "2024-01-05",
    queueSize: 12
  }
];

export default function PrinterManagement() {
  const getStatusIcon = (status: PrinterStatus["status"]) => {
    switch (status) {
      case "online": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "offline": return <XCircle className="h-4 w-4 text-gray-600" />;
      case "maintenance": return <Wrench className="h-4 w-4 text-yellow-600" />;
      case "error": return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: PrinterStatus["status"]) => {
    switch (status) {
      case "online": return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case "offline": return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
      case "maintenance": return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case "error": return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    }
  };



  const onlinePrinters = mockPrinters.filter(p => p.status === "online").length;
  const totalJobs = mockPrinters.reduce((sum, p) => sum + p.jobsToday, 0);
  const avgQueueSize = mockPrinters.reduce((sum, p) => sum + p.queueSize, 0) / mockPrinters.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Printer Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage all campus printers
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Printer
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Printers</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlinePrinters}/{mockPrinters.length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((onlinePrinters / mockPrinters.length) * 100)}% operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">+23% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Queue Size</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgQueueSize.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">jobs per printer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPrinters.filter(p => p.status !== "online").length}
            </div>
            <p className="text-xs text-muted-foreground">printers offline/error</p>
          </CardContent>
        </Card>
      </div>

      {/* Printer Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockPrinters.map((printer) => (
          <Card key={printer.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{printer.name}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {printer.location}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{printer.model}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(printer.status)}
                  {getStatusBadge(printer.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Paper Level */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Paper Level</span>
                  <span>{printer.paperLevel}%</span>
                </div>
                <Progress 
                  value={printer.paperLevel} 
                  className="h-2"
                />
              </div>

              {/* Toner Level */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Toner Level</span>
                  <span>{printer.tonerLevel}%</span>
                </div>
                <Progress 
                  value={printer.tonerLevel} 
                  className="h-2"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <div className="text-lg font-semibold">{printer.jobsToday}</div>
                  <div className="text-xs text-muted-foreground">Jobs Today</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{printer.queueSize}</div>
                  <div className="text-xs text-muted-foreground">In Queue</div>
                </div>
              </div>

              {/* Last Maintenance */}
              <div className="text-xs text-muted-foreground">
                Last maintained: {new Date(printer.lastMaintenance).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  disabled={printer.status === "maintenance"}
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  Maintain
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Send Low Toner Alerts
            </Button>
            <Button variant="outline" className="justify-start">
              <Activity className="h-4 w-4 mr-2" />
              Generate Usage Report
            </Button>
            <Button variant="outline" className="justify-start">
              <Wrench className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
