import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { qzTrayService, DetectedPrinter } from "@/services/qzTrayService";
import { printerService } from "@/services/printerService";
import { useAuth } from "@clerk/clerk-react";
import { 
  Printer, 
  RefreshCw, 
  Plus, 
  AlertTriangle
} from "lucide-react";

interface AddPrinterDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onPrinterAdded: () => void;
  readonly existingPrinters: Array<{ name: string; _id: string }>;
}

export function AddPrinterDialog({ open, onOpenChange, onPrinterAdded, existingPrinters }: AddPrinterDialogProps) {
  const [detectedPrinters, setDetectedPrinters] = useState<DetectedPrinter[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isQZConnected, setIsQZConnected] = useState(false);
  
  // Manual add form
  const [manualForm, setManualForm] = useState({
    name: "",
    location: "",
    ipAddress: "",
    model: "",
    capabilities: {
      color: false,
      duplex: false,
      paperSizes: ['A4'] as string[]
    }
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();

  const detectPrinters = useCallback(async () => {
    setIsDetecting(true);
    try {
      const printers = await qzTrayService.listPrinters();
      
      // Filter out printers that are already added
      const existingPrinterNames = existingPrinters.map(p => p.name.toLowerCase());
      const availablePrinters = printers.filter(printer => 
        !existingPrinterNames.includes(printer.name.toLowerCase())
      );
      
      setDetectedPrinters(availablePrinters);
      
      if (availablePrinters.length === 0 && printers.length > 0) {
        toast({
          title: "All Printers Already Added",
          description: "All detected printers have already been added to the system.",
        });
      } else if (availablePrinters.length === 0) {
        toast({
          title: "No Printers Found",
          description: "No printers were detected. Try adding one manually.",
        });
      }
    } catch (error) {
      console.error('Failed to detect printers:', error);
      toast({
        title: "Detection Failed",
        description: "Failed to detect printers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  }, [toast, existingPrinters]);

  const checkQZConnection = useCallback(async () => {
    try {
      await qzTrayService.connect();
      setIsQZConnected(true);
      detectPrinters();
    } catch (error) {
      console.error('QZ Tray connection failed:', error);
      setIsQZConnected(false);
      toast({
        title: "QZ Tray Connection Failed",
        description: "Please ensure QZ Tray is running to auto-detect printers.",
        variant: "destructive"
      });
    }
  }, [detectPrinters, toast]);

  useEffect(() => {
    if (open) {
      checkQZConnection();
    }
  }, [open, checkQZConnection]);

  const handleAddDetectedPrinter = async (printer: DetectedPrinter) => {
    setIsAdding(true);
    try {
      const token = await getToken();
      
      const printerData = {
        name: printer.name,
        location: "Auto-detected",
        status: "online" as const,
        connection: printer.connection || "local",
        type: printer.type || "unknown",
        capabilities: {
          color: true, // Default to true for auto-detected printers
          duplex: true, // Default to true for auto-detected printers
          paperSizes: ['A4', 'Letter'] // Default paper sizes
        }
      };

      await printerService.addPrinter(printerData, token);
      
      toast({
        title: "Printer Added",
        description: `${printer.name} has been added successfully.`,
      });
      
      onPrinterAdded();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to Add Printer",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddManualPrinter = async () => {
    if (!manualForm.name || !manualForm.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the printer name and location.",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      const token = await getToken();
      
      const printerData = {
        name: manualForm.name,
        location: manualForm.location,
        status: "offline" as const, // Start as offline for manual additions
        ipAddress: manualForm.ipAddress || undefined,
        model: manualForm.model || undefined,
        connection: "manual",
        type: "manual",
        capabilities: manualForm.capabilities
      };

      await printerService.addPrinter(printerData, token);
      
      toast({
        title: "Printer Added",
        description: `${manualForm.name} has been added successfully.`,
      });
      
      // Reset form
      setManualForm({
        name: "",
        location: "",
        ipAddress: "",
        model: "",
        capabilities: {
          color: false,
          duplex: false,
          paperSizes: ['A4']
        }
      });
      
      onPrinterAdded();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to Add Printer",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Printer</DialogTitle>
          <DialogDescription>
            Detect printers automatically or add them manually.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="detect" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detect">Auto-Detect</TabsTrigger>
            <TabsTrigger value="manual">Manual Add</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detect" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isQZConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  QZ Tray {isQZConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Button 
                onClick={detectPrinters} 
                disabled={!isQZConnected || isDetecting}
                size="sm"
              >
                {isDetecting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>

            {!isQZConnected && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      QZ Tray is not running. Please start QZ Tray to detect printers automatically.
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {detectedPrinters.length > 0 ? (
                detectedPrinters.map((printer, index) => (
                  <Card key={printer.name} className="cursor-pointer hover:bg-gray-50 border hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Printer className="h-5 w-5 text-gray-600" />
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2 group-hover:text-gray-900">
                              {printer.name}
                              {printer.isOnline !== undefined && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  printer.isOnline 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {printer.isOnline ? 'Online' : 'Offline'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 group-hover:text-gray-600">
                              {printer.connection} • {printer.type}
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAddDetectedPrinter(printer)}
                          disabled={isAdding}
                          size="sm"
                        >
                          {isAdding ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                !isDetecting && (
                  <div className="text-center py-8 text-gray-500">
                    {existingPrinters.length > 0 
                      ? "No new printers detected. All available printers may already be added."
                      : "No printers detected. Try refreshing or add manually."
                    }
                  </div>
                )
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Printer Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., HP LaserJet Pro"
                    value={manualForm.name}
                    onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Library - Ground Floor"
                    value={manualForm.location}
                    onChange={(e) => setManualForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ipAddress">IP Address</Label>
                  <Input
                    id="ipAddress"
                    placeholder="e.g., 192.168.1.100"
                    value={manualForm.ipAddress}
                    onChange={(e) => setManualForm(prev => ({ ...prev, ipAddress: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., HP LaserJet Pro M404dn"
                    value={manualForm.model}
                    onChange={(e) => setManualForm(prev => ({ ...prev, model: e.target.value }))}
                  />
                </div>
              </div>

              {/* Printer Capabilities Section */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Printer Capabilities</Label>
                
                {/* Color and Duplex Support */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="color"
                      checked={manualForm.capabilities.color}
                      onCheckedChange={(checked) => 
                        setManualForm(prev => ({
                          ...prev,
                          capabilities: { ...prev.capabilities, color: checked as boolean }
                        }))
                      }
                    />
                    <label
                      htmlFor="color"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Color Printing
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="duplex"
                      checked={manualForm.capabilities.duplex}
                      onCheckedChange={(checked) => 
                        setManualForm(prev => ({
                          ...prev,
                          capabilities: { ...prev.capabilities, duplex: checked as boolean }
                        }))
                      }
                    />
                    <label
                      htmlFor="duplex"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Duplex (Double-sided)
                    </label>
                  </div>
                </div>

                {/* Paper Sizes */}
                <div className="space-y-2">
                  <Label className="text-sm">Supported Paper Sizes</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {['A4', 'A3', 'Letter', 'Legal', 'Certificate'].map((size) => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`paper-${size}`}
                          checked={manualForm.capabilities.paperSizes.includes(size)}
                          onCheckedChange={(checked) => {
                            setManualForm(prev => ({
                              ...prev,
                              capabilities: {
                                ...prev.capabilities,
                                paperSizes: checked
                                  ? [...prev.capabilities.paperSizes, size]
                                  : prev.capabilities.paperSizes.filter(s => s !== size)
                              }
                            }));
                          }}
                        />
                        <label
                          htmlFor={`paper-${size}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {size}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Tabs defaultValue="detect" className="contents">
            <TabsContent value="manual" className="contents">
              <Button onClick={handleAddManualPrinter} disabled={isAdding}>
                {isAdding ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Printer
              </Button>
            </TabsContent>
          </Tabs>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
