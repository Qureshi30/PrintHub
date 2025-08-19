import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import FileUploader from "@/components/upload/FileUploader";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { FilePreview } from "@/components/FilePreview";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { Cloud, UploadIcon, HardDrive, FileText, AlertCircle, CheckCircle2, Image, FileSpreadsheet, File as FileIcon, Eye, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePrintJob } from "@/context/PrintJobContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Mock uploaded files interface
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  pages?: number;
  isImage: boolean;
  uploadedAt: string;
  status: "ready" | "processing" | "error";
}

// Mock uploaded files data
const mockUploadedFiles: UploadedFile[] = [
  {
    id: "1",
    name: "Assignment_Final.pdf",
    size: 2097152, // 2MB
    type: "pdf",
    pages: 15,
    isImage: false,
    uploadedAt: "2024-01-15T10:30:00Z",
    status: "ready"
  },
  {
    id: "2", 
    name: "Report_Draft.docx",
    size: 1048576, // 1MB
    type: "docx",
    pages: 8,
    isImage: false,
    uploadedAt: "2024-01-15T10:25:00Z",
    status: "ready"
  },
  {
    id: "3",
    name: "Presentation.pptx",
    size: 5242880, // 5MB
    type: "pptx",
    pages: 12,
    isImage: false,
    uploadedAt: "2024-01-15T10:20:00Z",
    status: "ready"
  },
  {
    id: "4",
    name: "Chart_Data.jpg",
    size: 524288, // 512KB
    type: "jpg",
    isImage: true,
    uploadedAt: "2024-01-15T10:15:00Z",
    status: "ready"
  }
];

export default function Upload() {
  const navigate = useNavigate();
  const { updateJobData } = usePrintJob();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(mockUploadedFiles);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const readyFiles = uploadedFiles.filter(f => f.status === "ready");

  // Callback to add newly uploaded files
  const handleFileUploaded = (uploadedFile: { id: string; name: string; size: number; url?: string }) => {
    const fileExtension = uploadedFile.name.toLowerCase().split('.').pop() || '';
    const isImageFile = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension);
    
    const newFile: UploadedFile = {
      id: uploadedFile.id,
      name: uploadedFile.name,
      size: uploadedFile.size,
      type: fileExtension,
      pages: estimatePages(uploadedFile.name, uploadedFile.size),
      isImage: isImageFile,
      uploadedAt: new Date().toISOString(),
      status: "ready"
    };
    
    setUploadedFiles(prev => [newFile, ...prev]);
    // Auto-select newly uploaded files
    setSelectedFiles(prev => [...prev, newFile.id]);
    
    // Show success notification
    toast({
      title: "File uploaded successfully!",
      description: `${newFile.name} has been added to your selection and is ready to print.`,
    });
  };

  // Estimate pages based on file type and size
  const estimatePages = (fileName: string, fileSize: number) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif') {
      return 1; // Images are typically 1 page
    }
    // Rough estimation for documents (500KB per page)
    return Math.max(1, Math.round(fileSize / (500 * 1024)));
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (file: UploadedFile) => {
    if (file.isImage) return Image;
    if (file.type === "pdf" || file.type === "docx" || file.type === "pptx") return FileText;
    if (file.type === "xlsx" || file.type === "csv") return FileSpreadsheet;
    return FileIcon;
  };

  const handleFileToggle = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === readyFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(readyFiles.map(f => f.id));
    }
  };

  const handleContinue = () => {
    if (selectedFiles.length > 0) {
      // Save selected files to print job context
      const selectedFilesData = selectedFiles.map(fileId => {
        const file = readyFiles.find(f => f.id === fileId);
        return {
          id: file!.id,
          name: file!.name,
          pages: file!.pages || 1,
          size: formatFileSize(file!.size),
          type: file!.type
        };
      });
      
      updateJobData({ selectedFiles: selectedFilesData });
      navigate("/print-settings");
    }
  };

  const getTotalPages = () => {
    return selectedFiles.reduce((total, fileId) => {
      const file = readyFiles.find(f => f.id === fileId);
      return total + (file?.pages || 1);
    }, 0);
  };

  const getTotalSize = () => {
    return selectedFiles.reduce((total, fileId) => {
      const file = readyFiles.find(f => f.id === fileId);
      return total + (file?.size || 0);
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
                  <FileUploader onFileUploaded={handleFileUploaded} />
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
              {selectedFiles.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
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
                      Select Files to Print ({readyFiles.length})
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedFiles.length === readyFiles.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {readyFiles.map((file) => {
                    const Icon = getFileIcon(file);
                    const isSelected = selectedFiles.includes(file.id);
                    
                    return (
                      <div 
                        key={file.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected ? "border-blue-500 bg-blue-50 text-blue-900" : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleFileToggle(file.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleFileToggle(file.id);
                          }
                        }}
                      >
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => handleFileToggle(file.id)}
                        />
                        
                        <div className={`p-2 rounded-lg ${
                          file.isImage ? "bg-green-100" : "bg-blue-100"
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            file.isImage ? "text-green-600" : "text-blue-600"
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className={`font-medium ${isSelected ? "text-blue-900" : "text-foreground"}`}>{file.name}</div>
                          <div className={`flex items-center gap-4 text-sm ${
                            isSelected ? "text-blue-700" : "text-muted-foreground"
                          }`}>
                            <span>{formatFileSize(file.size)}</span>
                            {file.pages && <span>{file.pages} pages</span>}
                            <span className="uppercase">{file.type}</span>
                            <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">Ready</Badge>
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
                        </div>
                      </div>
                    );
                  })}
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
                disabled={selectedFiles.length === 0}
                size="lg" 
                className="bg-gradient-hero px-8"
              >
                {selectedFiles.length > 0 
                  ? `Continue with ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} →`
                  : "Select files to continue"
                }
              </Button>
            ) : (
              <Button 
                onClick={() => navigate("/print-settings")} 
                size="lg" 
                className="bg-gradient-hero px-8"
              >
                Continue to Print Settings
              </Button>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {readyFiles.length > 0 && selectedFiles.length > 0 
                ? `Ready to print ${getTotalPages()} total pages`
                : "Upload files first, then select which ones to print"
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
