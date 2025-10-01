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
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { SpecialPaperAlert } from "@/components/SpecialPaperAlert";
import { useNavigate } from "react-router-dom";
import { usePrintJobContext } from "@/hooks/usePrintJobContext";
import { Calculator, FileText, Copy } from "lucide-react";

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
  const { files, updateFileSettings: updateContextFileSettings } = usePrintJobContext();
  const [activeTab, setActiveTab] = useState<string>("");
  const [showSpecialPaperAlert, setShowSpecialPaperAlert] = useState(false);
  const [specialPaperType, setSpecialPaperType] = useState<"A3" | "certificate" | "photo" | "cardstock">("A3");
  
  // Get selected files from flow context
  const selectedFiles = files || [];

  // Initialize settings for each file
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
      initialSettings[file.id] = { ...defaultSettings };
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

    // INR pricing: ₹1 per page for all types
    const baseCosts = {
      blackwhite: { regular: 1.00, photo: 1.00, cardstock: 1.00, transparency: 1.00 },
      color: { regular: 1.00, photo: 1.00, cardstock: 1.00, transparency: 1.00 }
    };

    const paperSizeMultiplier = {
      A4: 1.0,
      A3: 1.5,
      Letter: 1.0,
      Legal: 1.2
    };

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
    
    const baseCost = baseCosts[settings.colorMode][settings.paperType as keyof typeof baseCosts.color];
    const sizeMultiplier = paperSizeMultiplier[settings.paperSize as keyof typeof paperSizeMultiplier];
    const totalCost = pagesToPrint * settings.copies * baseCost * sizeMultiplier;
    
    return {
      perPage: baseCost * sizeMultiplier,
      total: totalCost,
      pages: pagesToPrint
    };
  };

  // Calculate total cost for all files
  const calculateTotalCost = () => {
    return selectedFiles.reduce((total, file) => {
      const fileCost = calculateFileCost(file.id);
      return total + fileCost.total;
    }, 0);
  };

  const handleContinue = () => {
    // Save all file settings to flow context
    selectedFiles.forEach(file => {
      const settings = fileSettings[file.id];
      if (settings) {
        // Determine the correct page range value
        let pageValue = settings.pageRange;
        if (settings.pageRange === 'custom' && settings.customPages) {
          pageValue = settings.customPages;
        } else if (settings.pageRange === 'current') {
          pageValue = '1'; // Default to first page for current
        }

        updateContextFileSettings(file.id, {
          pages: pageValue,
          copies: settings.copies,
          color: settings.colorMode === 'color',
          duplex: settings.duplex === 'double',
          paperType: settings.paperSize as 'A4' | 'A3' | 'Letter' | 'Legal' | 'Certificate',
        });
      }
    });
    navigate("/select-printer");
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <PrintFlowBreadcrumb currentStep="/print-settings" />
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Print Settings
            </h1>
            <p className="text-muted-foreground">
              Configure print preferences for each selected file
            </p>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="mt-2">
                <FileText className="h-3 w-3 mr-1" />
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          </div>

          {/* File Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedFiles.length}, 1fr)` }}>
              {selectedFiles.map((file) => (
                <TabsTrigger key={file.id} value={file.id} className="text-xs sm:text-sm">
                  {file.name.length > 15 ? `${file.name.substring(0, 12)}...` : file.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {selectedFiles.map((file) => {
              const settings = fileSettings[file.id];
              const cost = calculateFileCost(file.id);
              
              return (
                <TabsContent key={file.id} value={file.id} className="mt-6">
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Settings Panel */}
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Settings for {file.name}
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToAllFiles(file.id)}
                              className="flex items-center gap-1"
                            >
                              <Copy className="h-4 w-4" />
                              Copy to All
                            </Button>
                          </div>
                          <Badge variant="secondary">
                            {file.pages} pages • {file.type.toUpperCase()}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Page Range */}
                          <div className="space-y-2">
                            <Label htmlFor="pageRange">Page Range</Label>
                            <Select 
                              value={settings.pageRange} 
                              onValueChange={(value) => updateFileSettings(file.id, { pageRange: value })}
                            >
                              <SelectTrigger>
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
                                className="mt-2"
                                value={settings.customPages || ""}
                                onChange={(e) => updateFileSettings(file.id, { customPages: e.target.value })}
                              />
                            )}
                          </div>

                          <Separator />

                          {/* Color Mode */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Color Printing</Label>
                              <div className="text-sm text-muted-foreground">
                                Enable color printing (additional charges may apply)
                              </div>
                            </div>
                            <Switch 
                              checked={settings.colorMode === "color"}
                              onCheckedChange={(checked) => updateFileSettings(file.id, { colorMode: checked ? "color" : "blackwhite" })}
                            />
                          </div>

                          <Separator />

                          {/* Duplex */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Double-sided Printing</Label>
                              <div className="text-sm text-muted-foreground">
                                Print on both sides of the paper
                              </div>
                            </div>
                            <Switch 
                              checked={settings.duplex === "double"}
                              onCheckedChange={(checked) => updateFileSettings(file.id, { duplex: checked ? "double" : "single" })}
                            />
                          </div>

                          <Separator />

                          {/* Copies */}
                          <div className="space-y-2">
                            <Label htmlFor="copies">Number of Copies</Label>
                            <Input
                              id="copies"
                              type="number"
                              min="1"
                              max="100"
                              value={settings.copies}
                              onChange={(e) => updateFileSettings(file.id, { copies: parseInt(e.target.value) || 1 })}
                            />
                          </div>

                          <Separator />

                          {/* Paper Size */}
                          <div className="space-y-2">
                            <Label htmlFor="paperSize">Paper Size</Label>
                            <Select 
                              value={settings.paperSize} 
                              onValueChange={(value) => {
                                updateFileSettings(file.id, { paperSize: value });
                                // Check if special paper is selected
                                if (value === "A3") {
                                  setSpecialPaperType("A3");
                                  setShowSpecialPaperAlert(true);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select paper size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                                <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                                <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                                <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator />

                          {/* Paper Type */}
                          <div className="space-y-2">
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
                              <SelectTrigger>
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
                        </CardContent>
                      </Card>
                    </div>

                    {/* Cost Panel */}
                    <div>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Cost Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total for this file:</span>
                            <span className="flex items-center gap-1">
                              ₹{cost.total.toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Total Cost Summary */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-800">Total Cost for All Files</h3>
                  <p className="text-sm text-green-700">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} configured
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-800 flex items-center gap-1">
                    ₹{calculateTotalCost().toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/upload")} className="flex-1">
              Back to Upload
            </Button>
            <Button onClick={handleContinue} className="flex-1 bg-gradient-hero">
              Continue to Select Printer
            </Button>
          </div>
        </div>
      </div>
      
      {/* Special Paper Alert Modal */}
      <SpecialPaperAlert
        isOpen={showSpecialPaperAlert}
        onClose={() => setShowSpecialPaperAlert(false)}
        onConfirm={() => {
          setShowSpecialPaperAlert(false);
          // Continue with current settings
        }}
        paperType={specialPaperType}
        estimatedDelay={(() => {
          if (specialPaperType === "A3") return 30;
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