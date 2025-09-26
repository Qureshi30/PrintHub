import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import LocalFileUploader from "@/components/upload/LocalFileUploader";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { FilePreview } from "@/components/FilePreview";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { Cloud, UploadIcon, HardDrive, FileText, AlertCircle, CheckCircle2, Image, FileSpreadsheet, File as FileIcon, Eye, Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePrintJobContext } from "@/hooks/usePrintJobContext";
import { PrintJobFile } from "@/context/PrintJobFlowContext";

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

// Mock uploaded files data
// Remove the mock data - we'll use real uploads from Cloudinary

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [previewFile, setPreviewFile] = useState<PrintJobFile | null>(null);

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
    if (currentStep !== 'upload') {
      setCurrentStep('upload');
    }
  }, [currentStep, setCurrentStep]);

  const readyFiles = files; // All files in context are ready

  // Callback to add newly selected local files
  const handleLocalFileAdded = async (localFile: File) => {
    try {
      await addLocalFile(localFile);
      
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
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <PrintFlowBreadcrumb currentStep="/upload" />
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Upload Documents for Printing
            </h1>
            <p className="text-muted-foreground">
              Choose your preferred upload method and supported file formats
            </p>
          </div>

          {/* Supported Formats Info */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Supported Formats</span>
              </div>
              <p className="text-sm text-green-700">
                PDF, DOCX, PPTX, JPG, PNG, GIF, SVG, XLSX, CSV
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="device" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="device" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                From Device
              </TabsTrigger>
              <TabsTrigger value="cloud" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                From Cloud
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="device" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UploadIcon className="h-5 w-5" />
                    Upload from Your Device
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocalFileUploader onFileAdded={handleLocalFileAdded} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="cloud" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Upload from Cloud Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-16 flex-col gap-2" disabled>
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">G</div>
                      <span>Google Drive</span>
                      <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col gap-2" disabled>
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">D</div>
                      <span>Dropbox</span>
                      <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                    </Button>
                  </div>
                  
                  <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Cloud storage integration is currently under development. Please use device upload for now.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* File Selection Section */}
          {readyFiles.length > 0 && (
            <>
              {/* Selection Summary */}
              {readyFiles.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          {readyFiles.length} file{readyFiles.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-green-700">
                        <span>Total: {getTotalPages()} pages</span>
                        <span>Size: {formatFileSize(getTotalSize())}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Ready to Print ({readyFiles.length} {readyFiles.length === 1 ? 'file' : 'files'})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {readyFiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No files selected</p>
                      <p className="text-sm">Upload files above to add them to your print queue</p>
                    </div>
                  ) : (
                    readyFiles.map((file) => {
                      const Icon = getFileIcon(file);
                      
                      return (
                        <div 
                          key={file.id}
                          className="flex items-center gap-4 p-4 border rounded-lg border-blue-500 bg-blue-50 text-blue-900"
                        >
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          
                          <div className={`p-2 rounded-lg ${
                            file.isImage ? "bg-green-100" : "bg-blue-100"
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              file.isImage ? "text-green-600" : "text-blue-600"
                            }`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium text-blue-900">{file.name}</div>
                            <div className="flex items-center gap-4 text-sm text-blue-700">
                              <span>{formatFileSize(file.size)}</span>
                              {!!file.pages && <span>{file.pages} pages</span>}
                              <span className="uppercase">{file.type}</span>
                              <Badge variant="default" className="text-xs">Ready</Badge>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                              title="Preview file"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(file);
                              }}
                              title="Remove file"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Upload Tips */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Upload Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">✅ Best Practices:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Use PDF for best print quality</li>
                    <li>• Keep file size under 20MB</li>
                    <li>• Check document orientation</li>
                    <li>• Ensure text is readable</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">⚠️ Common Issues:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Password-protected files</li>
                    <li>• Corrupted documents</li>
                    <li>• Unsupported formats</li>
                    <li>• Very large file sizes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="text-center">
            {readyFiles.length > 0 ? (
              <Button 
                onClick={handleContinue} 
                disabled={readyFiles.length === 0}
                size="lg" 
                className="bg-gradient-hero px-8"
              >
                {(() => {
                  if (readyFiles.length === 0) return "Upload files to continue";
                  const fileText = readyFiles.length === 1 ? 'file' : 'files';
                  return `Continue with ${readyFiles.length} ${fileText} →`;
                })()}
              </Button>
            ) : (
              <Button 
                onClick={() => navigate("/student/history")} 
                size="lg" 
                className="bg-gradient-hero px-8"
              >
                View Print History
              </Button>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {readyFiles.length > 0 
                ? `Ready to print ${getTotalPages()} total pages`
                : "Upload files first to start printing"
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          file={{
            id: previewFile.id,
            name: previewFile.name,
            size: previewFile.size,
            type: previewFile.type,
            pages: previewFile.pages
          }}
        />
      )}
    </ProtectedRoute>
  );
}
