import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import PrinterCompatibilityAlert from "@/components/PrinterCompatibilityAlert";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileStepNavigation } from "@/components/mobile/MobileStepNavigation";
import { MobileCard, MobileTouchButton } from "@/components/mobile/MobileComponents";
import { useNavigate } from "react-router-dom";
import { Printer, Clock, Users, CheckCircle, Loader2, MapPin, AlertTriangle } from "lucide-react";
import { printerService, type PrinterStation } from "@/services/printerService";
import { usePrintJobContext } from "@/hooks/usePrintJobContext";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  
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
    if (queueLength <= 2) return "text-green-600";
    if (queueLength <= 5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <ProtectedRoute>
      <MobileHeader 
        title="Select Printer" 
        showBackButton={true}
        backTo="/student/print-settings"
        rightAction={
          selectedPrinterId && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Selected
            </Badge>
          )
        }
      />
      
      <div className={`${isMobile ? 'pb-24' : ''} container mx-auto py-8 px-4`}>
        <div className="max-w-4xl mx-auto space-y-6">
          {!isMobile && <PrintFlowBreadcrumb currentStep="/select-printer" />}
          
          <div className={`text-center space-y-2 ${isMobile ? 'px-4' : ''}`}>
            <h1 className={`font-bold tracking-tight text-blue-600 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
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
              <Button onClick={() => globalThis.location.reload()}>Try Again</Button>
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
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
              {printers.map((printer) => {
                // Check if this printer is incompatible
                const isIncompatible = selectedPrinterId === printer.id && hasIncompatibleSettings;
                const isSelected = selectedPrinterId === printer.id;
                
                return (
                  <MobileCard 
                    key={printer.id}
                    selected={isSelected}
                    className={`cursor-pointer transition-all duration-200 ${
                      isIncompatible 
                        ? "border-red-500 bg-red-50/50" 
                        : isSelected 
                        ? "border-blue-500 bg-blue-50/50" 
                        : "hover:shadow-md hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPrinterId(printer.id)}
                  >
                    <div className="space-y-4">
                      {/* Printer Header - Location as main focus */}
                      <div className={`flex items-start justify-between ${isMobile ? 'flex-col gap-2' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            printer.status === 'online' ? 'bg-green-100' : 
                            printer.status === 'maintenance' ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <Printer className={`h-6 w-6 ${
                              printer.status === 'online' ? 'text-green-600' : 
                              printer.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              {printer.location}
                            </h3>
                            <div className="text-sm text-gray-600">
                              {printer.name}
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <Badge 
                          variant={printer.status === 'online' ? 'default' : 'secondary'}
                          className={`${
                            printer.status === 'online' ? 'bg-green-100 text-green-800' : 
                            printer.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          } ${isMobile ? 'self-start' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(printer.status)}`} />
                          {printer.status === 'online' ? 'Available' : 
                           printer.status === 'maintenance' ? 'Maintenance' : 'Offline'}
                        </Badge>
                      </div>

                      {/* Printer Stats */}
                      <div className="grid gap-4 grid-cols-2">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>Queue</span>
                          </div>
                          <div className={`font-semibold ${getQueueColor(printer.queueLength)}`}>
                            {printer.queueLength} jobs
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Wait Time</span>
                          </div>
                          <div className="font-semibold text-gray-900">
                            {printer.estimatedWait} min
                          </div>
                        </div>
                      </div>

                      {/* Printer Capabilities */}
                      <div className="pt-2 border-t">
                        <div className="flex flex-wrap gap-2">
                          {printer.capabilities?.color && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              Color Printing
                            </Badge>
                          )}
                          {printer.capabilities?.duplex && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Duplex
                            </Badge>
                          )}
                          {printer.capabilities?.paperSizes?.includes('A3') && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              A3 Support
                            </Badge>
                          )}
                          {printer.capabilities?.paperSizes?.includes('A4') && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              A4
                            </Badge>
                          )}
                          {printer.capabilities?.paperSizes?.includes('Letter') && (
                            <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">
                              Letter
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg ${
                          isIncompatible ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isIncompatible ? (
                            <>
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">Incompatible Settings</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Selected</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Mobile Select Button */}
                      {isMobile && !isSelected && printer.status === 'online' && (
                        <MobileTouchButton
                          onClick={() => setSelectedPrinterId(printer.id)}
                          className="w-full"
                        >
                          Select This Printer
                        </MobileTouchButton>
                      )}
                    </div>
                  </MobileCard>
                );
              })}
            </div>
          )}

          {/* Mobile Step Navigation */}
          {isMobile && (
            <MobileStepNavigation
              currentStep={2}
              totalSteps={4}
              onPrevious={() => navigate('/print-settings')}
              onNext={handleContinue}
              nextDisabled={!selectedPrinterId || hasIncompatibleSettings}
              nextLabel={hasIncompatibleSettings ? "Resolve Issues" : "Continue"}
            />
          )}

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate('/print-settings')} className="flex-1">
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
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}