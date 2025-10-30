import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { useNavigate } from "react-router-dom";
import { usePrintJobContext } from "@/hooks/usePrintJobContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePricing } from "@/hooks/usePricing";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileStepNavigation } from "@/components/mobile/MobileStepNavigation";
import { MobileCard, MobileTouchButton } from "@/components/mobile/MobileComponents";
import {
  FileText,
  Printer,
  Clock,
  AlertTriangle,
  DollarSign,
  Edit,
  ArrowLeft
} from "lucide-react";

interface JobSummary {
  file: {
    name: string;
    pages: number;
    size: string;
  };
  settings: {
    pageRange: string;
    colorMode: string;
    duplex: string;
    copies: number;
    paperSize: string;
    paperType: string;
  };
  printer: {
    name: string;
    location: string;
    queueLength: number;
    estimatedWait: number;
  };
  cost: {
    base: number;
    color: number;
    duplex: number;
    total: number;
  };
  timing: {
    scheduledFor: string;
    estimatedCompletion: string;
  };
}

export default function Confirmation() {
  const navigate = useNavigate();
  const { files, settings, selectedPrinter, setPaymentInfo } = usePrintJobContext();
  const { pricing, loading: pricingLoading, calculateCostBreakdown } = usePricing();
  const isMobile = useIsMobile();

  // Get the first file for display (assuming single file upload for now)
  const currentFile = files[0];
  const currentFileSettings = currentFile ? settings[currentFile.id] : null;

  // Debug logging
  console.log('🔍 CONFIRMATION PAGE - Debug:', {
    hasFile: !!currentFile,
    fileName: currentFile?.name,
    hasSettings: !!currentFileSettings,
    settings: currentFileSettings,
    color: currentFileSettings?.color,
    duplex: currentFileSettings?.duplex,
    paperType: currentFileSettings?.paperType
  });

  // Calculate cost using dynamic pricing from admin panel
  const calculatedCost = useMemo(() => {
    if (!currentFile || !currentFileSettings || pricingLoading) {
      return { base: 0, color: 0, duplex: 0, paperSurcharge: 0, total: 0 };
    }

    const pages = currentFile.pages || 1;
    const copies = currentFileSettings.copies || 1;
    const isColor = currentFileSettings.color || false;
    const isDuplex = currentFileSettings.duplex || false;
    const paperType = (currentFileSettings.paperType || 'A4').toLowerCase();

    console.log('📊 CONFIRMATION - Cost calculation inputs:', {
      pages,
      copies,
      isColor,
      isDuplex,
      paperType
    });

    // Use dynamic pricing calculation
    const breakdown = calculateCostBreakdown({
      pageCount: pages * copies,
      isColor,
      paperSize: paperType,
      isDuplex
    });

    console.log('💰 CONFIRMATION - Calculated breakdown:', breakdown);

    return {
      base: breakdown.baseCost,
      color: isColor ? breakdown.baseCost : 0,
      duplex: breakdown.duplexDiscountAmount,
      paperSurcharge: breakdown.paperCost,
      total: breakdown.totalCost
    };
  }, [currentFile, currentFileSettings, pricingLoading, calculateCostBreakdown]);

  console.log('💰 CONFIRMATION PAGE - Calculated Cost:', calculatedCost);

  // Mock job summary data - replace with actual data from context
  const jobSummary: JobSummary = {
    file: {
      name: currentFile?.name || "No document selected",
      pages: currentFile?.pages || 0,
      size: currentFile ? `${(currentFile.sizeKB / 1024).toFixed(1)} MB` : "0 MB"
    },
    settings: {
      pageRange: currentFileSettings?.pages || "All pages",
      colorMode: currentFileSettings?.color ? "Color" : "Black & White",
      duplex: currentFileSettings?.duplex ? "Double-sided" : "One-sided",
      copies: currentFileSettings?.copies || 1,
      paperSize: currentFileSettings?.paperType || "A4",
      paperType: currentFileSettings?.paperType || "Regular"
    },
    printer: {
      name: selectedPrinter?.name || "Library Printer 1",
      location: selectedPrinter?.location || "Main Library - Ground Floor",
      queueLength: selectedPrinter?.queueLength || 3,
      estimatedWait: selectedPrinter?.estimatedWait || 8
    },
    cost: {
      base: calculatedCost.base,
      color: calculatedCost.color,
      duplex: calculatedCost.duplex,
      total: calculatedCost.total
    },
    timing: {
      scheduledFor: "Now",
      estimatedCompletion: "~10 minutes"
    }
  };

  const handleSubmit = () => {
    // Prevent submission if no document is selected
    if (jobSummary.file.pages === 0 || !currentFile) {
      navigate('/upload');
      return;
    }

    console.log('📤 CONFIRMATION - Submitting with cost:', calculatedCost);

    // Store the calculated cost in payment context
    setPaymentInfo({
      method: 'razorpay', // Default method, will be updated on payment page
      totalCost: calculatedCost.total,
      breakdown: {
        baseCost: calculatedCost.base,
        colorCost: calculatedCost.color,
        paperCost: calculatedCost.paperSurcharge
      }
    });

    console.log('✅ CONFIRMATION - Navigating to payment page');

    // Always navigate to payment when there's a file
    navigate("/payment");
  };

  const getSubmitButtonText = () => {
    if (jobSummary.file.pages === 0) return "Upload Document First";
    // Always show pay button if file exists, cost will be calculated
    return "Submit Print Job & Pay";
  };

  return (
    <ProtectedRoute>
      {isMobile ? (
        <>
          <MobileHeader
            title="Confirm Print Job"
            rightAction={
              <MobileTouchButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
              >
                History
              </MobileTouchButton>
            }
          />
          <div className="px-4 pb-20 space-y-4">
            {/* No Document Warning */}
            {jobSummary.file.pages === 0 && (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  No document selected. Please upload a document first.
                  <MobileTouchButton
                    variant="secondary"
                    size="sm"
                    className="mt-2 w-full bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-800/20 dark:text-orange-200 dark:border-orange-700"
                    onClick={() => navigate('/upload')}
                  >
                    Upload Document Now
                  </MobileTouchButton>
                </AlertDescription>
              </Alert>
            )}

            {/* Document Summary */}
            <MobileCard selected={false} className={jobSummary.file.pages === 0 ? 'opacity-60' : ''}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {jobSummary.file.pages === 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${jobSummary.file.pages === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {jobSummary.file.name}
                    </span>
                    <MobileTouchButton
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/settings')}
                      className="text-blue-600 dark:text-blue-400 h-8 px-2"
                    >
                      <Edit className="h-4 w-4" />
                    </MobileTouchButton>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {jobSummary.file.pages} pages • {jobSummary.file.size}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {jobSummary.settings.colorMode}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {jobSummary.settings.copies} {jobSummary.settings.copies === 1 ? 'copy' : 'copies'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {jobSummary.settings.duplex}
                    </Badge>
                  </div>
                </div>
              </div>
            </MobileCard>

            {/* Printer Summary */}
            <MobileCard selected={false} className={jobSummary.file.pages === 0 ? 'opacity-60' : ''}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Printer className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{jobSummary.printer.name}</span>
                    <MobileTouchButton
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/select-printer')}
                      className="text-blue-600 dark:text-blue-400 h-8 px-2"
                    >
                      <Edit className="h-4 w-4" />
                    </MobileTouchButton>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {jobSummary.printer.location}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">~{jobSummary.printer.estimatedWait} min wait</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {jobSummary.printer.queueLength} in queue
                    </Badge>
                  </div>
                </div>
              </div>
            </MobileCard>

            {/* Cost Breakdown */}
            {jobSummary.cost.total > 0 && (
              <MobileCard selected={false} className={jobSummary.file.pages === 0 ? 'opacity-60' : ''}>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-3 text-foreground">Cost Breakdown</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-foreground">
                        <span>Base printing ({jobSummary.file.pages} pages)</span>
                        <span>₹{jobSummary.cost.base.toFixed(2)}</span>
                      </div>
                      {jobSummary.cost.duplex > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Duplex discount ({pricing.discounts.duplexPercentage}%)</span>
                          <span>-₹{jobSummary.cost.duplex.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-medium text-foreground">
                        <span>Total</span>
                        <span>₹{jobSummary.cost.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </MobileCard>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <MobileTouchButton
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={jobSummary.file.pages === 0}
                className="w-full"
              >
                {getSubmitButtonText()}
              </MobileTouchButton>

              <MobileTouchButton
                variant="secondary"
                size="lg"
                onClick={() => navigate('/select-printer')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Printer Selection
              </MobileTouchButton>
            </div>
          </div>

          <MobileStepNavigation
            currentStep={4}
            totalSteps={5}
          />
        </>
      ) : (
        /* Desktop Layout */
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <PrintFlowBreadcrumb currentStep="confirm" />

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Confirm Your Print Job</h1>
              <p className="text-muted-foreground">Review your print settings and submit your job</p>
            </div>

            {jobSummary.file.pages === 0 && (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  No document selected. Please upload a document first.
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-3 bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-800/20 dark:text-orange-200 dark:border-orange-700"
                    onClick={() => navigate('/upload')}
                  >
                    Upload Document Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Document Summary */}
                <Card className={jobSummary.file.pages === 0 ? 'opacity-60' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Document</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/settings')}
                      className="text-blue-600"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{jobSummary.file.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {jobSummary.file.pages} pages • {jobSummary.file.size}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Page Range:</span>
                        <div className="font-medium text-foreground">{jobSummary.settings.pageRange}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Color Mode:</span>
                        <div className="font-medium text-foreground">{jobSummary.settings.colorMode}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duplex:</span>
                        <div className="font-medium text-foreground">{jobSummary.settings.duplex}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Copies:</span>
                        <div className="font-medium text-foreground">{jobSummary.settings.copies}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Printer Summary */}
                <Card className={jobSummary.file.pages === 0 ? 'opacity-60' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">Printer</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/select-printer')}
                      className="text-blue-600"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Printer className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{jobSummary.printer.name}</div>
                        <div className="text-sm text-muted-foreground">{jobSummary.printer.location}</div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">~{jobSummary.printer.estimatedWait} min wait</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {jobSummary.printer.queueLength} in queue
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Cost Breakdown */}
                {jobSummary.cost.total > 0 && (
                  <Card className={jobSummary.file.pages === 0 ? 'opacity-60' : ''}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Cost Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-foreground">
                        <span>Base printing ({jobSummary.file.pages} pages)</span>
                        <span>₹{jobSummary.cost.base.toFixed(2)}</span>
                      </div>
                      {jobSummary.cost.duplex > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Duplex discount ({pricing.discounts.duplexPercentage}%)</span>
                          <span>-₹{jobSummary.cost.duplex.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-semibold text-foreground">
                        <span>Total</span>
                        <span>₹{jobSummary.cost.total.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/select-printer')}
                className="px-8"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={jobSummary.file.pages === 0}
                className="px-8"
              >
                {getSubmitButtonText()}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}