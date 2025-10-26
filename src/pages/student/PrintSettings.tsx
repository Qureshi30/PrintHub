import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { SpecialPaperAlert } from "@/components/SpecialPaperAlert";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileStepNavigation } from "@/components/mobile/MobileStepNavigation";
import { MobileCard, MobileTouchButton } from "@/components/mobile/MobileComponents";
import { useNavigate } from "react-router-dom";
import { usePrintJobContext } from "@/hooks/usePrintJobContext";
import { usePricing } from "@/hooks/usePricing";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calculator, FileText, Copy, Settings, ChevronDown, ChevronUp, Palette, FileStack, Printer } from "lucide-react";

interface PrintSettings {
  pageRange: string;
  customPages?: string;
  colorMode: "color" | "blackwhite";
  duplex: "single" | "double";
  copies: number;
  paperSize: string;
  paperType: string;
}

interface FileSettings {
  [fileId: string]: PrintSettings;
}

export default function PrintSettings() {
  const navigate = useNavigate();
  const { files, settings: contextSettings, updateFileSettings: updateContextFileSettings } = usePrintJobContext();
  const { pricing, loading: pricingLoading, error: pricingError } = usePricing();
  const [activeTab, setActiveTab] = useState<string>("");
  const [showSpecialPaperAlert, setShowSpecialPaperAlert] = useState(false);
  const [specialPaperType, setSpecialPaperType] = useState<"A3" | "certificate" | "photo" | "cardstock">("A3");
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const isMobile = useIsMobile();

  // Get selected files from flow context
  const selectedFiles = files || [];

  // Initialize settings for each file - load from context if available
  const [fileSettings, setFileSettings] = useState<FileSettings>(() => {
    const defaultSettings: PrintSettings = {
      pageRange: "all",
      colorMode: "blackwhite",
      duplex: "single",
      copies: 1,
      paperSize: "A4",
      paperType: "regular"
    };

    const initialSettings: FileSettings = {};
    selectedFiles.forEach(file => {
      // Load from context if available, otherwise use defaults
      const savedSettings = contextSettings[file.id];
      if (savedSettings) {
        initialSettings[file.id] = {
          pageRange: savedSettings.pages === 'all' ? 'all' : (savedSettings.pages === '1' ? 'current' : 'custom'),
          customPages: savedSettings.pages !== 'all' && savedSettings.pages !== '1' ? savedSettings.pages : undefined,
          colorMode: savedSettings.color ? 'color' : 'blackwhite',
          duplex: savedSettings.duplex ? 'double' : 'single',
          copies: savedSettings.copies || 1,
          paperSize: savedSettings.paperType || 'A4',
          paperType: 'regular'
        };
      } else {
        initialSettings[file.id] = { ...defaultSettings };
      }
    });

    return initialSettings;
  });

  // Debug: Log files when component mounts
  useEffect(() => {
    const currentFiles = files || [];
    console.log('⚙️ PRINT SETTINGS PAGE: Component mounted, current files:', currentFiles.length);
    currentFiles.forEach((file, index) => {
      console.log(`📄 PRINT SETTINGS PAGE: File ${index + 1}: ${file.name}`, {
        id: file.id,
        hasFileProperty: !!file.file,
        fileType: file.file?.type,
        cloudinaryUrl: file.cloudinaryUrl
      });
    });
  }, [files]);

  // Set the first file as active tab if not set
  if (!activeTab && selectedFiles.length > 0) {
    setActiveTab(selectedFiles[0].id);
  }

  // If no files selected, redirect to upload
  if (selectedFiles.length === 0) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-2xl font-bold text-gray-600">No Files Selected</h1>
            <p className="text-muted-foreground">Please upload and select files first</p>
            <Button onClick={() => navigate("/upload")} className="bg-gradient-hero">
              Go to Upload
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Update settings for a specific file
  const updateFileSettings = (fileId: string, newSettings: Partial<PrintSettings>) => {
    setFileSettings(prev => {
      const currentSettings = prev[fileId];
      const updatedSettings = { ...currentSettings, ...newSettings };

      return {
        ...prev,
        [fileId]: updatedSettings
      };
    });

    // Update global context - convert string values to proper types
    let pageValue: string;
    if (newSettings.pageRange === 'custom' && newSettings.customPages) {
      pageValue = newSettings.customPages;
    } else if (newSettings.pageRange === 'current') {
      pageValue = '1';
    } else {
      pageValue = 'all';
    }

    const contextSettings = {
      pages: pageValue,
      copies: newSettings.copies,
      color: newSettings.colorMode === 'color',
      duplex: newSettings.duplex === 'double',
      paperType: newSettings.paperSize as 'A4' | 'A3' | 'Letter' | 'Legal' | 'Certificate',
    };
    updateContextFileSettings(fileId, contextSettings);
  };

  // Copy settings from one file to all files
  const copyToAllFiles = (sourceFileId: string) => {
    const sourceSettings = fileSettings[sourceFileId];
    const newSettings: FileSettings = {};
    selectedFiles.forEach(file => {
      newSettings[file.id] = { ...sourceSettings };
    });
    setFileSettings(newSettings);
  };

  // Cost calculation for a specific file
  const calculateFileCost = (fileId: string) => {
    const file = selectedFiles.find(f => f.id === fileId);
    const settings = fileSettings[fileId];
    if (!file || !settings) return { perPage: 0, total: 0, pages: 0 };

    // Use dynamic pricing from the pricing hook
    if (pricingLoading || !pricing) {
      return { perPage: 0, total: 0, pages: 0 };
    }

    // Get base rates from pricing configuration
    const BLACK_AND_WHITE_RATE = pricing.baseRates.blackAndWhite;
    const COLOR_RATE = pricing.baseRates.color;

    // Calculate pages to print based on page range selection
    let pagesToPrint = file.pages;
    if (settings.pageRange === "current") {
      pagesToPrint = 1;
    } else if (settings.pageRange === "custom" && settings.customPages) {
      // Parse custom page range to estimate page count
      const customPages = settings.customPages.trim();
      try {
        // Simple estimation: count ranges and individual pages
        const ranges = customPages.split(',');
        let estimatedPages = 0;
        ranges.forEach(range => {
          const trimmedRange = range.trim();
          if (trimmedRange.includes('-')) {
            const [start, end] = trimmedRange.split('-').map(n => parseInt(n.trim()));
            if (!isNaN(start) && !isNaN(end) && end >= start) {
              estimatedPages += (end - start + 1);
            }
          } else {
            const page = parseInt(trimmedRange);
            if (!isNaN(page)) {
              estimatedPages += 1;
            }
          }
        });
        if (estimatedPages > 0) {
          pagesToPrint = Math.min(estimatedPages, file.pages);
        }
      } catch {
        // Invalid custom page range, using all pages
        pagesToPrint = file.pages;
      }
    }

    // Determine base cost based on color mode
    const baseCost = settings.colorMode === "color" ? COLOR_RATE : BLACK_AND_WHITE_RATE;

    // Get paper surcharge from pricing configuration
    const paperSizeLower = settings.paperSize.toLowerCase();
    const paperSurcharge = pricing.paperSurcharges[paperSizeLower as keyof typeof pricing.paperSurcharges] || 0;

    // Calculate total cost: (base cost per page * pages * copies) + paper surcharge
    let totalCost = (pagesToPrint * settings.copies * baseCost) + paperSurcharge;

    // Apply duplex discount from pricing configuration
    if (settings.duplex === "double") {
      const duplexDiscount = totalCost * (pricing.discounts.duplexPercentage / 100);
      totalCost -= duplexDiscount;
    }

    return {
      perPage: baseCost,
      total: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      pages: pagesToPrint,
      paperSurcharge,
      duplexDiscount: settings.duplex === "double" ? pricing.discounts.duplexPercentage : 0
    };
  };

  const handleContinue = () => {
    navigate("/student/select-printer");
  };

  const getTotalCost = () => {
    return selectedFiles.reduce((total, file) => {
      const cost = calculateFileCost(file.id);
      return total + cost.total;
    }, 0);
  };

  return (
    <ProtectedRoute>
      <MobileHeader
        title="Print Settings"
        showBackButton={true}
        backTo="/upload"
        rightAction={
          pricingLoading ? (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              Loading...
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              ₹{getTotalCost().toFixed(2)}
            </Badge>
          )
        }
      />

      <div className={`${isMobile ? 'pb-24' : ''} container mx-auto py-8 px-4`}>
        <div className="max-w-6xl mx-auto space-y-6">
          {!isMobile && <PrintFlowBreadcrumb currentStep="/student/print-settings" />}

          {/* Pricing Error Alert */}
          {pricingError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Pricing Information Unavailable</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Using default pricing. Some calculations may not be accurate. Please refresh the page.
              </p>
            </div>
          )}

          <div className={`text-center space-y-2 ${isMobile ? 'px-4' : ''}`}>
            <h1 className={`font-bold tracking-tight text-blue-600 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
              Configure Print Settings
            </h1>
            <p className="text-muted-foreground">
              Customize print options for each file
            </p>
          </div>

          {/* Mobile Summary Card */}
          {isMobile && (
            <MobileCard className="border-blue-200 bg-blue-50/50">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  Total Cost: ₹{getTotalCost().toFixed(2)}
                </div>
              </div>
            </MobileCard>
          )}

          {/* File Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`${isMobile ? 'w-full h-auto flex-col space-y-1' : 'grid grid-cols-2 lg:grid-cols-3'}`}>
              {selectedFiles.map((file) => (
                <TabsTrigger
                  key={file.id}
                  value={file.id}
                  className={`${isMobile ? 'w-full justify-start' : ''} flex items-center gap-2`}
                >
                  <FileText className="h-4 w-4" />
                  <span className={isMobile && file.name.length > 25 ? 'truncate' : ''}>
                    {isMobile && file.name.length > 25 ? `${file.name.substring(0, 22)}...` : file.name}
                  </span>
                  <Badge variant="secondary" className="ml-auto">
                    ₹{calculateFileCost(file.id).total.toFixed(2)}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {selectedFiles.map((file) => {
              const settings = fileSettings[file.id] || {
                pageRange: "all",
                colorMode: "blackwhite" as const,
                duplex: "single" as const,
                copies: 1,
                paperSize: "A4",
                paperType: "regular"
              };
              const cost = calculateFileCost(file.id);

              return (
                <TabsContent key={file.id} value={file.id} className="space-y-6">
                  <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
                    {/* Settings Panel */}
                    <div className={isMobile ? '' : 'lg:col-span-2'}>
                      <MobileCard>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Settings className="h-5 w-5" />
                              <h3 className="font-semibold">Print Settings</h3>
                            </div>
                            {!isMobile && selectedFiles.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToAllFiles(file.id)}
                                className="flex items-center gap-1"
                              >
                                <Copy className="h-4 w-4" />
                                Copy to All
                              </Button>
                            )}
                          </div>

                          {/* Mobile Copy to All Button */}
                          {isMobile && selectedFiles.length > 1 && (
                            <MobileTouchButton
                              variant="secondary"
                              onClick={() => copyToAllFiles(file.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Settings to All Files
                            </MobileTouchButton>
                          )}

                          {/* Settings Grid */}
                          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                            {/* Page Settings */}
                            <div className="space-y-4">
                              <h4 className="font-medium flex items-center gap-2">
                                <FileStack className="h-4 w-4" />
                                Page Settings
                              </h4>

                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="pageRange">Page Range</Label>
                                  <Select
                                    value={settings.pageRange}
                                    onValueChange={(value) => updateFileSettings(file.id, { pageRange: value })}
                                  >
                                    <SelectTrigger className={isMobile ? 'h-12' : ''}>
                                      <SelectValue placeholder="Select page range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Pages</SelectItem>
                                      <SelectItem value="current">Current Page</SelectItem>
                                      <SelectItem value="custom">Custom Range</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {settings.pageRange === "custom" && (
                                    <Input
                                      placeholder="e.g., 1-5, 8, 10-12"
                                      className={`mt-2 ${isMobile ? 'h-12' : ''}`}
                                      value={settings.customPages || ""}
                                      onChange={(e) => updateFileSettings(file.id, { customPages: e.target.value })}
                                    />
                                  )}
                                </div>

                                <div>
                                  <Label htmlFor="copies">Number of Copies</Label>
                                  <Input
                                    id="copies"
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={settings.copies}
                                    onChange={(e) => updateFileSettings(file.id, { copies: parseInt(e.target.value) || 1 })}
                                    className={isMobile ? 'h-12' : ''}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Print Quality */}
                            <div className="space-y-4">
                              <h4 className="font-medium flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Print Quality
                              </h4>

                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="colorMode">Color Mode</Label>
                                  <Select
                                    value={settings.colorMode}
                                    onValueChange={(value: "color" | "blackwhite") => updateFileSettings(file.id, { colorMode: value })}
                                  >
                                    <SelectTrigger className={isMobile ? 'h-12' : ''}>
                                      <SelectValue placeholder="Select color mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="blackwhite">Black & White</SelectItem>
                                      <SelectItem value="color">Color</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label htmlFor="duplex">Double-sided</Label>
                                  <Switch
                                    id="duplex"
                                    checked={settings.duplex === "double"}
                                    onCheckedChange={(checked) => updateFileSettings(file.id, { duplex: checked ? "double" : "single" })}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Paper Settings */}
                            <div className="space-y-4">
                              <h4 className="font-medium flex items-center gap-2">
                                <Printer className="h-4 w-4" />
                                Paper Settings
                              </h4>

                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="paperSize">Paper Size</Label>
                                  <Select
                                    value={settings.paperSize}
                                    onValueChange={(value) => {
                                      updateFileSettings(file.id, { paperSize: value });
                                      if (value === "A3") {
                                        setSpecialPaperType("A3");
                                        setShowSpecialPaperAlert(true);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className={isMobile ? 'h-12' : ''}>
                                      <SelectValue placeholder="Select paper size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="A4">A4</SelectItem>
                                      <SelectItem value="A3">A3</SelectItem>
                                      <SelectItem value="Letter">Letter</SelectItem>
                                      <SelectItem value="Legal">Legal</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="paperType">Paper Type</Label>
                                  <Select
                                    value={settings.paperType}
                                    onValueChange={(value) => {
                                      updateFileSettings(file.id, { paperType: value });
                                      // Check if special paper type is selected
                                      if (value === "photo") {
                                        setSpecialPaperType("photo");
                                        setShowSpecialPaperAlert(true);
                                      } else if (value === "cardstock") {
                                        setSpecialPaperType("cardstock");
                                        setShowSpecialPaperAlert(true);
                                      } else if (value === "certificate") {
                                        setSpecialPaperType("certificate");
                                        setShowSpecialPaperAlert(true);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className={isMobile ? 'h-12' : ''}>
                                      <SelectValue placeholder="Select paper type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="regular">Regular Paper</SelectItem>
                                      <SelectItem value="photo">Photo Paper</SelectItem>
                                      <SelectItem value="cardstock">Cardstock</SelectItem>
                                      <SelectItem value="certificate">Certificate Paper</SelectItem>
                                      <SelectItem value="transparency">Transparency</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </MobileCard>
                    </div>

                    {/* Cost Panel */}
                    <div>
                      <MobileCard>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            <h3 className="font-semibold">Cost Breakdown</h3>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Pages to print:</span>
                              <span>{cost.pages}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Copies:</span>
                              <span>{settings.copies}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Cost per page:</span>
                              <span>₹{cost.perPage.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Color mode:</span>
                              <span className="capitalize">{settings.colorMode === "blackwhite" ? "B&W" : "Color"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Paper:</span>
                              <span>{settings.paperSize} {settings.paperType}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-medium">
                              <span>Total Cost:</span>
                              <span className="text-blue-600">₹{cost.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </MobileCard>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Total Summary - Desktop only */}
          {!isMobile && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Total Print Cost</span>
                  </div>
                  <div className="text-lg font-bold text-green-800">
                    ₹{getTotalCost().toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Continue button - Desktop only */}
          {!isMobile && (
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate("/upload")} className="flex-1">
                Back to Upload
              </Button>
              <Button onClick={handleContinue} className="flex-1 bg-gradient-hero text-white">
                Continue to Select Printer →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Step Navigation */}
      <MobileStepNavigation
        currentStep={2}
        totalSteps={5}
        onNext={handleContinue}
        onPrevious={() => navigate('/upload')}
        nextLabel="Select Printer"
        previousLabel="Back to Upload"
      />

      {/* Special Paper Alert */}
      <SpecialPaperAlert
        isOpen={showSpecialPaperAlert}
        onClose={() => setShowSpecialPaperAlert(false)}
        onConfirm={() => {
          setShowSpecialPaperAlert(false);
        }}
        paperType={specialPaperType}
        estimatedDelay={(() => {
          if (specialPaperType === "A3") return 5;
          if (specialPaperType === "certificate") return 20;
          return 15;
        })()}
        files={selectedFiles.map(file => ({
          name: file.name,
          pages: file.pages
        }))}
      />
    </ProtectedRoute>
  );
}