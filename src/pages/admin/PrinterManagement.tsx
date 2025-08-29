import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePrinters } from "@/hooks/useDatabase";
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

export default function PrinterManagement() {
  const { data: printers, isLoading } = usePrinters();
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading printers...</div>
        </div>
      </div>
    );
  }

  const printerList = printers?.data || [];
  const onlinePrinters = printerList.filter(p => p.status === "online").length;
  const totalQueueSize = printerList.reduce((sum, p) => sum + (p.queue?.length || 0), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "offline": return <XCircle className="h-4 w-4 text-gray-600" />;
      case "maintenance": return <Wrench className="h-4 w-4 text-yellow-600" />;
      case "busy": return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online": return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case "offline": return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
      case "maintenance": return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case "busy": return <Badge className="bg-blue-100 text-blue-800">Busy</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Printer Status</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlinePrinters}/{printerList.length}</div>
            <p className="text-xs text-muted-foreground">
              {printerList.length > 0 ? Math.round((onlinePrinters / printerList.length) * 100) : 0}% operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQueueSize}</div>
            <p className="text-xs text-muted-foreground">Jobs in all queues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Ink Level</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {printerList.length > 0 ? 
                Math.round(printerList.reduce((sum, p) => sum + (p.inkLevel || 0), 0) / printerList.length) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all printers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {printerList.filter(p => p.status !== "online").length}
            </div>
            <p className="text-xs text-muted-foreground">Printers need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Printer List */}
      <Card>
        <CardHeader>
          <CardTitle>All Printers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {printerList.map((printer) => (
            <div key={printer._id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                {getStatusIcon(printer.status)}
                <div>
                  <div className="font-medium">{printer.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {printer.location}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium">Queue: {printer.queue?.length || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    Ink: {printer.inkLevel || 0}% | Paper: {printer.paperLevel || 0}%
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <Progress value={printer.inkLevel || 0} className="w-20 h-2" />
                  <Progress value={printer.paperLevel || 0} className="w-20 h-2" />
                </div>
                
                {getStatusBadge(printer.status)}
                
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {printerList.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No printers found. Add your first printer to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
