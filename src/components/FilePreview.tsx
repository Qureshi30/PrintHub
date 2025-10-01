import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  Download, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  AlertCircle,
  Loader
} from "lucide-react";

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    pages?: number;
    url?: string; // Mock URL for preview
  };
}

// Mock preview data - in real app, these would come from your backend
const mockPreviewUrls: Record<string, string> = {
  "1": "/api/preview/assignment_final.pdf", // PDF preview
  "2": "/api/preview/report_draft.docx", // Document preview
  "3": "/api/preview/image_scan.jpg", // Image preview
  "4": "/api/preview/presentation.pptx", // Presentation preview
};

// Mock page thumbnails for multi-page documents
const mockPageThumbnails = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%23f8f9fa' stroke='%23dee2e6'/%3E%3Ctext x='100' y='140' text-anchor='middle' fill='%23495057' font-family='Arial' font-size='14'%3EPage 1%3C/text%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%23f8f9fa' stroke='%23dee2e6'/%3E%3Ctext x='100' y='140' text-anchor='middle' fill='%23495057' font-family='Arial' font-size='14'%3EPage 2%3C/text%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%23f8f9fa' stroke='%23dee2e6'/%3E%3Ctext x='100' y='140' text-anchor='middle' fill='%23495057' font-family='Arial' font-size='14'%3EPage 3%3C/text%3E%3C/svg%3E",
];

export function FilePreview({ isOpen, onClose, file }: Readonly<FilePreviewProps>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Simulate loading delay
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setPreviewError(false);
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Simulate occasional preview errors
        if (Math.random() < 0.1) {
          setPreviewError(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, file.id]);

  const getFileIcon = (type: string, props: { className?: string }) => {
    if (type.includes('image')) return <ImageIcon {...props} />;
    if (type.includes('pdf') || type.includes('document')) return <FileText {...props} />;
    return <FileIcon {...props} />;
  };

  const isImage = file.type.includes('image');
  const isPDF = file.type.includes('pdf');
  
  const maxPages = file.pages || (isImage ? 1 : 3); // Mock page count

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <Loader className="h-8 w-8 animate-spin mb-4" />
          <p>Loading preview...</p>
        </div>
      );
    }

    if (previewError) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 text-red-400" />
          <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
          <p className="text-center mb-4">
            Unable to generate preview for this file type or the file may be corrupted.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.open(mockPreviewUrls[file.id], '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download to View
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Preview Image/Document */}
        <div 
          className="flex justify-center p-4 bg-gray-50 rounded-lg min-h-96"
          style={{ minHeight: isFullscreen ? '60vh' : '400px' }}
        >
          <div 
            className="transition-transform duration-200 border rounded shadow-sm bg-white"
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            {isImage ? (
              <img 
                src={mockPageThumbnails[0]} 
                alt={`Preview of ${file.name}`}
                className="max-w-full h-auto"
                style={{ maxHeight: '500px' }}
              />
            ) : (
              <div className="w-96 h-96 flex items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  {getFileIcon(file.type, { className: "h-16 w-16 mx-auto mb-4 text-gray-400" })}
                  <p className="text-sm text-gray-500">
                    {isPDF ? 'PDF Document' : 'Document Preview'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Page {currentPage} of {maxPages}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page Navigation for multi-page documents */}
        {maxPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Page</span>
              <Badge variant="outline">{currentPage} of {maxPages}</Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, maxPages))}
              disabled={currentPage === maxPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Page Thumbnails for navigation */}
        {maxPages > 1 && (
          <ScrollArea className="w-full">
            <div className="flex gap-2 p-2">
              {Array.from({ length: maxPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`flex-shrink-0 border-2 rounded transition-colors ${
                    currentPage === i + 1 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img 
                    src={mockPageThumbnails[i] || mockPageThumbnails[0]}
                    alt={`Page ${i + 1}`}
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div className="text-xs text-center p-1 bg-white">
                    {i + 1}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-7xl h-[90vh]' : 'max-w-4xl'}`}>
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              File Preview
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* File Info */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              {getFileIcon(file.type, { className: "h-4 w-4" })}
              <span className="font-medium truncate max-w-xs">{file.name}</span>
            </div>
            <Badge variant="outline">{formatFileSize(file.size)}</Badge>
            {Boolean(file.pages) && (
              <Badge variant="outline">{file.pages} pages</Badge>
            )}
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-mono min-w-12 text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(mockPreviewUrls[file.id], '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Preview Content */}
        <ScrollArea className={`${isFullscreen ? 'h-[calc(90vh-200px)]' : 'max-h-[60vh]'}`}>
          <div ref={previewRef}>
            {getPreviewContent()}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <div>
            Use mouse wheel or zoom buttons to adjust size
          </div>
          {!previewError && (
            <div>
              Preview generated • Not final print quality
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
