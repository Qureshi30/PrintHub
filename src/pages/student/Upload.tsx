import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import LocalFileUploader from "@/components/upload/LocalFileUploader";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { FilePreview } from "@/components/FilePreview";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileStepNavigation } from "@/components/mobile/MobileStepNavigation";
import { MobileCard, MobileTouchButton } from "@/components/mobile/MobileComponents";
import { Cloud, UploadIcon, HardDrive, FileText, AlertCircle, CheckCircle2, Image, FileSpreadsheet, File as FileIcon, Eye, Download, X, Plus, Files } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePrintJobContext } from "@/hooks/usePrintJobContext";
import { PrintJobFile } from "@/context/PrintJobFlowContext";
import { useIsMobile } from "@/hooks/use-mobile";

// Uploaded files interface (based on the actual upload component)
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  pages?: number;
  isImage: boolean;
  uploadedAt: string;
  status: "ready" | "processing" | "error";
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [previewFile, setPreviewFile] = useState<PrintJobFile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Use print job flow context
  const {
    files,
    addLocalFile,
    removeFile,
    goToNextStep,
    currentStep,
    setCurrentStep
  } = usePrintJobContext();

  // Ensure we're on the upload step when this component mounts
  useEffect(() => {
    console.log('📂 UPLOAD PAGE: Component mounted, current files:', files.length);
    files.forEach((file, index) => {
      console.log(`📄 UPLOAD PAGE: File ${index + 1}: ${file.name}`, {
        id: file.id,
        hasFileProperty: !!file.file,
        fileType: file.file?.type,
        cloudinaryUrl: file.cloudinaryUrl
      });
    });
    
    if (currentStep !== 'upload') {
      setCurrentStep('upload');
    }
  }, [currentStep, setCurrentStep, files]);

  const readyFiles = files; // All files in context are ready

  // Callback to add newly selected local files
  const handleLocalFileAdded = async (localFile: File) => {
    try {
      console.log('📤 UPLOAD PAGE: Adding file:', localFile.name, {
        fileType: localFile.type,
        fileSize: localFile.size,
        lastModified: localFile.lastModified
      });
      
      await addLocalFile(localFile);
      
      console.log('✅ UPLOAD PAGE: File added successfully, current files count:', files.length + 1);
      
      // Show success notification
      toast({
        title: "File added successfully!",
        description: `${localFile.name} has been added to your selection and will be uploaded after payment.`,
      });
    } catch (error) {
      console.error('Failed to add file:', error);
      toast({
        title: "Error adding file",
        description: `Failed to process ${localFile.name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Handle file removal
  const handleRemoveFile = (file: PrintJobFile) => {
    removeFile(file.id);
    
    // Show removal notification
    toast({
      title: "File removed",
      description: `${file.name} has been removed from your selection.`,
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (file: PrintJobFile) => {
    if (file.isImage) return Image;
    if (file.type === "pdf" || file.type === "docx" || file.type === "pptx") return FileText;
    if (file.type === "xlsx" || file.type === "csv") return FileSpreadsheet;
    return FileIcon;
  };

  const handleContinue = async () => {
    if (readyFiles.length === 0) return;
    
    // Proceed to settings step if we have files
    goToNextStep(); // Goes to settings step
    navigate("/student/print-settings");
  };

  const getTotalPages = () => {
    return readyFiles.reduce((total, file) => {
      return total + (file.pages || 1);
    }, 0);
  };

  const getTotalSize = () => {
    return readyFiles.reduce((total, file) => {
      return total + (file.size || 0);
    }, 0);
  };

  return (
    <ProtectedRoute>
      {isMobile && (
        <MobileSidebar 
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />
      )}
      <MobileHeader 
        title="Upload Documents" 
        showBackButton={true}
        backTo="/student/dashboard"
        onMenuClick={() => setIsSidebarOpen(true)}
        rightAction={
          readyFiles.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {readyFiles.length} {readyFiles.length === 1 ? 'file' : 'files'}
            </Badge>
          )
        }
      />
      
      <div className={`${isMobile ? 'pb-24' : ''} container mx-auto py-8 px-4`}>
        <div className="max-w-4xl mx-auto space-y-6">
          {!isMobile && <PrintFlowBreadcrumb currentStep="/upload" />}
          
          <div className={`text-center space-y-2 ${isMobile ? 'px-4' : ''}`}>
            <h1 className={`font-bold tracking-tight text-blue-600 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
              Upload Documents for Printing
            </h1>
            <p className="text-muted-foreground">
              Choose your preferred upload method and supported file formats
            </p>
          </div>

          {/* Supported Formats Info */}
          <MobileCard className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">Supported Formats</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              PDF, DOCX, PPTX, JPG, PNG, GIF, SVG, XLSX, CSV
            </p>
          </MobileCard>

          <Tabs defaultValue="device" className="w-full">
            <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-12' : ''}`}>
              <TabsTrigger value="device" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                {isMobile ? 'Device' : 'From Device'}
              </TabsTrigger>
              <TabsTrigger value="cloud" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                {isMobile ? 'Cloud' : 'From Cloud'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="device" className="mt-6">
              <MobileCard>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UploadIcon className="h-5 w-5" />
                    <h3 className="font-semibold">Upload from Your Device</h3>
                  </div>
                  <LocalFileUploader onFileAdded={handleLocalFileAdded} />
                </div>
              </MobileCard>
            </TabsContent>
            
            <TabsContent value="cloud" className="mt-6">
              <MobileCard>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    <h3 className="font-semibold">Upload from Cloud Storage</h3>
                  </div>
                  
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <Button variant="outline" className={`${isMobile ? 'h-12' : 'h-16'} flex-col gap-2`} disabled>
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">G</div>
                      <span>Google Drive</span>
                      <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                    </Button>
                    <Button variant="outline" className={`${isMobile ? 'h-12' : 'h-16'} flex-col gap-2`} disabled>
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">D</div>
                      <span>Dropbox</span>
                      <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                    </Button>
                  </div>
                  
                  <MobileCard className="border-yellow-200 bg-yellow-50/50">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        Cloud storage integration is currently under development. Please use device upload for now.
                      </span>
                    </div>
                  </MobileCard>
                </div>
              </MobileCard>
            </TabsContent>
          </Tabs>

          {/* File Selection Section */}
          {readyFiles.length > 0 && (
            <>
              {/* Selection Summary */}
              <MobileCard className="border-green-200 bg-green-50/50">
                <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-2 text-center' : ''}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      {readyFiles.length} file{readyFiles.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className={`flex gap-4 text-sm text-green-700 ${isMobile ? 'justify-center' : ''}`}>
                    <span>Total: {getTotalPages()} pages</span>
                    <span>Size: {formatFileSize(getTotalSize())}</span>
                  </div>
                </div>
              </MobileCard>

              {/* File Selection */}
              <MobileCard>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Files className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Ready to Print</h3>
                    </div>
                    <Badge variant="secondary">
                      {readyFiles.length} {readyFiles.length === 1 ? 'file' : 'files'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {readyFiles.map((file) => {
                      const Icon = getFileIcon(file);
                      
                      return (
                        <MobileCard 
                          key={file.id}
                          className="border-blue-500 bg-blue-50 text-blue-900"
                          selected={true}
                        >
                          <div className={`flex items-center gap-4 ${isMobile ? 'flex-col text-center' : ''}`}>
                            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            
                            <div className={`p-2 rounded-lg bg-blue-100 flex-shrink-0`}>
                              <Icon className="h-6 w-6 text-blue-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-blue-900 truncate">{file.name}</h4>
                              <div className={`flex gap-4 text-sm text-blue-700 ${isMobile ? 'justify-center flex-wrap' : ''}`}>
                                <span>{file.pages || 1} pages</span>
                                <span>{formatFileSize(file.size || 0)}</span>
                                <span className="capitalize">{file.type}</span>
                              </div>
                            </div>
                            
                            <div className={`flex gap-2 ${isMobile ? 'w-full justify-center' : ''}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewFile(file)}
                                className="bg-white hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4" />
                                {!isMobile && <span className="ml-2">Preview</span>}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveFile(file)}
                                className="bg-white hover:bg-red-50 text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                                {!isMobile && <span className="ml-2">Remove</span>}
                              </Button>
                            </div>
                          </div>
                        </MobileCard>
                      );
                    })}
                  </div>
                </div>
              </MobileCard>
            </>
          )}

          {/* Upload Tips - Desktop only */}
          {!isMobile && (
            <Card>
              <CardHeader>
                <CardTitle>📝 Upload Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">📄 Supported formats</h4>
                    <p className="text-gray-600">PDF, DOCX, PPTX, XLSX, JPG, PNG, GIF, SVG files are supported</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">📐 File size limit</h4>
                    <p className="text-gray-600">Maximum file size is 50MB per file</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">🖨️ Print quality</h4>
                    <p className="text-gray-600">Higher resolution files will produce better print quality</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">💰 Cost estimation</h4>
                    <p className="text-gray-600">Final cost will be calculated in the next step based on your print settings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Continue button - Desktop only */}
          {!isMobile && readyFiles.length > 0 && (
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => navigate("/student/dashboard")}>
                Cancel
              </Button>
              <Button 
                onClick={handleContinue}
                className="bg-gradient-hero text-white px-8"
              >
                Continue to Print Settings →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Step Navigation */}
      <MobileStepNavigation
        currentStep={1}
        totalSteps={5}
        onNext={readyFiles.length > 0 ? handleContinue : undefined}
        onPrevious={() => navigate('/student/dashboard')}
        nextLabel="Continue to Settings"
        previousLabel="Back to Dashboard"
        nextDisabled={readyFiles.length === 0}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview 
          isOpen={!!previewFile}
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}
    </ProtectedRoute>
  );
}