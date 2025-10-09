import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import PrinterCompatibilityAlert from "@/components/PrinterCompatibilityAlert";
import { useNavigate } from "react-router-dom";
import { Printer, Clock, Users, CheckCircle, Loader2 } from "lucide-react";
import { printerService, type PrinterStation } from "@/services/printerService";
import { usePrintJobContext } from "@/hooks/usePrintJobContext";
import { type PrintJobFile, type PrintJobSettings } from "@/context/PrintJobFlowContext";
import { 
  validatePrinterCompatibility, 
  type PrinterCapabilities,
  type PrintSettings as CompatibilityPrintSettings,
  type CompatibilityResult
} from "@/utils/printerCompatibility";

export default function SelectPrinter() {
  const navigate = useNavigate();
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  const [printers, setPrinters] = useState<PrinterStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);
  const [showCompatibilityAlert, setShowCompatibilityAlert] = useState(false);
  const [printerCapabilities, setPrinterCapabilities] = useState<PrinterCapabilities | null>(null);
  const [hasIncompatibleSettings, setHasIncompatibleSettings] = useState(false);
  
  // Use PrintJob context
  const { files, settings, selectPrinter, setCurrentStep } = usePrintJobContext();

  // Helper function to check files compatibility
  const checkFilesCompatibility = (
    files: PrintJobFile[], 
    settings: { [fileId: string]: PrintJobSettings }, 
    capabilities: PrinterCapabilities
  ): CompatibilityResult | null => {
    if (files && files.length > 0) {
      for (const file of files) {
        const fileSettings = settings[file.id];
        const userSettings: CompatibilityPrintSettings = {
          color: fileSettings?.color ?? false,
          duplex: fileSettings?.duplex ?? false,
          paperType: fileSettings?.paperType ?? 'A4',
          copies: fileSettings?.copies ?? 1,
        };

        const result = validatePrinterCompatibility(userSettings, capabilities);
        if (result && !result.isCompatible) {
          return result;
        }
      }
    } else {
      // Fallback for no files
      const defaultSettings: CompatibilityPrintSettings = {
        color: false,
        duplex: false,
        paperType: 'A4',
        copies: 1,
      };

      const result = validatePrinterCompatibility(defaultSettings, capabilities);
      if (result && !result.isCompatible) {
        return result;
      }
    }
    return null;
  };

  // Set current step and fetch printers from backend
  useEffect(() => {
    setCurrentStep('printer');
    
    const fetchPrinters = async () => {
      try {
        setLoading(true);
        const availablePrinters = await printerService.getAvailablePrinters();
        setPrinters(availablePrinters);
        setError(null);
      } catch (err) {
        console.error('Error fetching printers:', err);
        setError('Failed to load printers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrinters();
  }, [setCurrentStep]);

  // Validate printer compatibility when printer is selected
  useEffect(() => {
    if (!selectedPrinterId) return;

    const validateCompatibility = async () => {
      try {
        const selectedPrinter = printers.find(p => p.id === selectedPrinterId);
        if (!selectedPrinter?.capabilities) return;

        const capabilities: PrinterCapabilities = {
          colorSupport: selectedPrinter.capabilities.color,
          duplexSupport: selectedPrinter.capabilities.duplex,
          supportedPaperTypes: selectedPrinter.capabilities.paperSizes,
          maxCopies: 100,
        };

        setPrinterCapabilities(capabilities);

        // Check compatibility
        const incompatibleResult = checkFilesCompatibility(files, settings, capabilities);
        
        if (incompatibleResult) {
          setCompatibilityResult(incompatibleResult);
          setShowCompatibilityAlert(true);
          setHasIncompatibleSettings(true);
        } else {
          setShowCompatibilityAlert(false);
          setHasIncompatibleSettings(false);
        }
      } catch (error) {
        console.error('Failed to validate printer compatibility:', error);
      }
    };

    validateCompatibility();
  }, [selectedPrinterId, printers, files, settings]);

  const handleContinue = () => {
    if (selectedPrinterId && !hasIncompatibleSettings) {
      // Store selected printer in context
      const selectedPrinterData = printers.find(p => p.id === selectedPrinterId);
      if (selectedPrinterData) {
        selectPrinter({
          _id: selectedPrinterId,
          name: selectedPrinterData.name,
          location: selectedPrinterData.location,
          status: selectedPrinterData.status,
          queueLength: selectedPrinterData.queueLength,
          estimatedWait: selectedPrinterData.estimatedWait
        });
      }
      
      // Also store in sessionStorage for backward compatibility
      sessionStorage.setItem('selectedPrinter', JSON.stringify({
        id: selectedPrinterId,
        name: selectedPrinterData?.name,
        location: selectedPrinterData?.location,
        pricing: selectedPrinterData?.pricing
      }));
      
      navigate("/confirmation");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "offline": return "bg-red-500";
      case "maintenance": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getQueueColor = (queueLength: number) => {
    if (queueLength === 0) return "text-green-600";
    if (queueLength <= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <PrintFlowBreadcrumb currentStep="/select-printer" />
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Select Printer Station
            </h1>
            <p className="text-muted-foreground">
              Choose from available printer stations
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading printers...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          )}

          {/* Printer Compatibility Alert */}
          {showCompatibilityAlert && compatibilityResult && printerCapabilities && (
            <div className="mt-4">
              <PrinterCompatibilityAlert
                compatibilityResult={compatibilityResult}
                printerName={printers.find(p => p.id === selectedPrinterId)?.name || "Selected Printer"}
                currentSettings={{
                  color: files?.[0] ? (settings[files[0].id]?.color ?? false) : false,
                  duplex: files?.[0] ? (settings[files[0].id]?.duplex ?? false) : false,
                  paperType: files?.[0] ? (settings[files[0].id]?.paperType ?? 'A4') : 'A4',
                  copies: files?.[0] ? (settings[files[0].id]?.copies ?? 1) : 1,
                }}
                capabilities={printerCapabilities}
              />
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-2">
              {printers.map((printer) => {
                // Check if this printer is incompatible
                const isIncompatible = selectedPrinterId === printer.id && hasIncompatibleSettings;
                
                // Determine ring classes based on selection and compatibility
                let ringClasses = "";
                if (selectedPrinterId === printer.id) {
                  ringClasses = isIncompatible 
                    ? "ring-2 ring-red-500 bg-red-50/50" 
                    : "ring-2 ring-blue-500 bg-blue-50/50";
                }
                
                return (
                  <Card 
                    key={printer.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${ringClasses} ${printer.status !== "online" ? "opacity-60" : ""}`}
                    onClick={() => printer.status === "online" && setSelectedPrinterId(printer.id)}
                  >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Printer className="h-5 w-5" />
                          {printer.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {printer.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(printer.status)}`} />
                        <Badge variant={printer.status === "online" ? "default" : "secondary"}>
                          {printer.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Queue Information */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-medium ${getQueueColor(printer.queueLength)}`}>
                          {printer.queueLength} in queue
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          ~{printer.estimatedWait} min wait
                        </span>
                      </div>
                    </div>

                    {/* Queue Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Queue Load</span>
                        <span>{Math.min(printer.queueLength * 10, 100)}%</span>
                      </div>
                      <Progress value={Math.min(printer.queueLength * 10, 100)} className="h-2" />
                    </div>

                    {/* Capabilities */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Capabilities:</div>
                      <div className="flex flex-wrap gap-1">
                        {printer.capabilities?.color && (
                          <Badge variant="outline" className="text-xs">Color</Badge>
                        )}
                        {printer.capabilities?.duplex && (
                          <Badge variant="outline" className="text-xs">Duplex</Badge>
                        )}
                        {printer.capabilities?.paperSizes?.map(size => (
                          <Badge key={size} variant="outline" className="text-xs">{size}</Badge>
                        )) || (
                          <Badge variant="outline" className="text-xs">A4</Badge>
                        )}
                      </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Pricing:</div>
                      <div className="text-sm text-muted-foreground">
                        {printerService.formatCurrency(printer.pricing.baseCostPerPage, printer.pricing.currency)} per page
                        {printer.capabilities.color && printer.pricing.colorCostPerPage > 0 && (
                          <span className="ml-2">
                            • Color: +{printerService.formatCurrency(printer.pricing.colorCostPerPage, printer.pricing.currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedPrinterId === printer.id && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Selected</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              Back to Settings
            </Button>
            <Button 
              onClick={handleContinue} 
              disabled={!selectedPrinterId || hasIncompatibleSettings}
              className="flex-1 bg-gradient-hero"
            >
              {hasIncompatibleSettings ? "Resolve Compatibility Issues" : "Continue to Confirmation"}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}