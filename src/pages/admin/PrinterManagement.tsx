import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePrinters } from "@/hooks/useDatabase";
import { AddPrinterDialog } from "@/components/admin/AddPrinterDialog";
import { EditPrinterDialog } from "@/components/admin/EditPrinterDialog";
import { DeletePrinterDialog } from "@/components/admin/DeletePrinterDialog";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/apiClient";
import { 
  Printer, 
  Plus, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Wrench,
  MapPin,
  Edit,
  Trash2,
  Power
} from "lucide-react";

interface Printer {
  _id: string;
  name: string;
  location: string;
  status: string;
  queue?: Array<unknown>;
  queueLength?: number; // Actual queue count from Queue collection
  supplies?: {
    inkLevel?: {
      black?: number;
      cyan?: number;
      magenta?: number;
      yellow?: number;
    };
    paperLevel?: number;
    tonerLevel?: number;
  };
  // Legacy properties for backward compatibility
  inkLevel?: number;
  paperLevel?: number;
}

export default function PrinterManagement() {
  const { printers, loading } = usePrinters();
  const { getToken } = useAuth();
  const { toast } = useToast();
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [togglingPrinter, setTogglingPrinter] = useState<string | null>(null);

  // Event handlers
  const handleAddPrinter = () => {
    setAddDialogOpen(true);
  };

  const handleEditPrinter = (printer: Printer) => {
    setSelectedPrinter(printer);
    setEditDialogOpen(true);
  };

  const handleDeletePrinter = (printer: Printer) => {
    setSelectedPrinter(printer);
    setDeleteDialogOpen(true);
  };

  const refreshData = () => {
    // Force a small delay then reload to ensure data is fresh
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handlePrinterAdded = () => {
    refreshData();
  };

  const handlePrinterUpdated = () => {
    refreshData();
  };

  const handlePrinterDeleted = () => {
    refreshData();
  };

  const handleToggleStatus = async (printer: Printer) => {
    const newStatus = printer.status === 'online' ? 'offline' : 'online';
    setTogglingPrinter(printer._id);

    try {
      const token = await getToken();
      const response = await apiClient.put(`/printers/${printer._id}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = response.data;

      if (result.success) {
        toast({
          title: "Status Updated",
          description: `${printer.name} is now ${newStatus}.`
        });
        refreshData();
      } else {
        throw new Error(result.error?.message || 'Failed to update printer status');
      }
    } catch (error) {
      console.error('Error toggling printer status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update printer status",
        variant: "destructive"
      });
    } finally {
      setTogglingPrinter(null);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading printers...</div>
        </div>
      </div>
    );
  }

  const printerList = printers || [];
  const onlinePrinters = printerList.filter(p => p.status === "online").length;
  const totalQueueSize = printerList.reduce((sum, p) => sum + (p.queue?.length || 0), 0);

  const getInkLevel = (printer: Printer): number => {
    if (printer.inkLevel !== undefined) return printer.inkLevel;
    if (printer.supplies?.inkLevel) {
      const { black, cyan, magenta, yellow } = printer.supplies.inkLevel;
      const levels = [black, cyan, magenta, yellow].filter((level): level is number => level !== undefined);
      return levels.length > 0 ? Math.min(...levels) : 0;
    }
    return 0;
  };

  const getPaperLevel = (printer: Printer): number => {
    return printer.paperLevel ?? printer.supplies?.paperLevel ?? 0;
  };

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
        <Button onClick={handleAddPrinter}>
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
                Math.round(printerList.reduce((sum, p) => sum + getInkLevel(p), 0) / printerList.length) : 0}%
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
                  <div className="text-sm font-medium">Queue: {printer.queueLength ?? 0}</div>
                  <div className="text-xs text-muted-foreground">
                    Ink: {getInkLevel(printer)}% | Paper: {getPaperLevel(printer)}%
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <Progress value={getInkLevel(printer)} className="w-20 h-2" />
                  <Progress value={getPaperLevel(printer)} className="w-20 h-2" />
                </div>
                
                {getStatusBadge(printer.status)}
                
                <div className="flex gap-2">
                  <Button 
                    variant={printer.status === 'online' ? 'default' : 'outline'}
                    size="sm" 
                    onClick={() => handleToggleStatus(printer)}
                    disabled={togglingPrinter === printer._id}
                    className={printer.status === 'online' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditPrinter(printer)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeletePrinter(printer)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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

      {/* Dialog Components */}
      <AddPrinterDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onPrinterAdded={handlePrinterAdded}
        existingPrinters={printerList.map(p => ({ name: p.name, _id: p._id }))}
      />

      <EditPrinterDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onPrinterUpdated={handlePrinterUpdated}
        printer={selectedPrinter}
      />

      <DeletePrinterDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onPrinterDeleted={handlePrinterDeleted}
        printer={selectedPrinter}
      />
    </div>
  );
}
