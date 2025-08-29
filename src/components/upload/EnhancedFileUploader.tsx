import { useCallback, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cloudinaryService } from "@/lib/cloudinaryService";
import { useCreatePrintJob } from "@/hooks/useDatabase";
import { PrintJob } from "@/types/database";
import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
  UploadCloud,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const ACCEPT = ".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.svg,.xlsx,.csv,.ppt,.pptx";

// Max file size (10MB for print jobs)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Upload queue item
type QueueItem = {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "uploaded" | "error";
  errorMessage?: string;
  cloudinaryUrl?: string;
  publicId?: string;
};

function formatBytes(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function getIconForFile(file: File) {
  const name = file.name.toLowerCase();
  if (name.match(/\.(png|jpg|jpeg|gif|svg)$/)) return ImageIcon;
  if (name.match(/\.(pdf|doc|docx|txt|rtf|ppt|pptx)$/)) return FileText;
  if (name.match(/\.(csv|xlsx)$/)) return FileSpreadsheet;
  return FileIcon;
}

interface EnhancedFileUploaderProps {
  onFileUploaded?: (jobId: string) => void;
  maxFiles?: number;
}

export default function EnhancedFileUploader({ 
  onFileUploaded, 
  maxFiles = 5 
}: EnhancedFileUploaderProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const createPrintJobMutation = useCreatePrintJob();

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file type
    if (!cloudinaryService.isFileTypeSupported(file)) {
      return { isValid: false, error: "Unsupported file type" };
    }

    // Check file size
    if (!cloudinaryService.isFileSizeValid(file)) {
      return { isValid: false, error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` };
    }

    return { isValid: true };
  }, []);

  const uploadToCloudinary = useCallback(async (item: QueueItem): Promise<void> => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      // Update status to uploading
      setItems((prev) => prev.map((p) => 
        p.id === item.id 
          ? { ...p, status: "uploading", progress: 0 } 
          : p
      ));

      // Upload to Cloudinary
      const result = await cloudinaryService.uploadPrintJobFile(
        item.file, 
        item.id, 
        user.id
      );

      // Update progress to 50% after Cloudinary upload
      setItems((prev) => prev.map((p) => 
        p.id === item.id 
          ? { ...p, progress: 50, cloudinaryUrl: result.secure_url, publicId: result.public_id } 
          : p
      ));

      // Create print job in database
      const printJobData: Omit<PrintJob, '_id' | 'createdAt' | 'updatedAt'> = {
        clerkUserId: user.id,
        printerId: '', // Will be selected later
        file: {
          cloudinaryUrl: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          sizeKB: cloudinaryService.getFileSizeInKB(item.file)
        },
        settings: {
          pages: 'all',
          copies: 1,
          color: false,
          duplex: false,
          paperType: 'A4'
        },
        status: 'pending',
        misprint: false,
        reprintCount: 0
      };

      const response = await createPrintJobMutation.mutateAsync(printJobData);

      if (response.success && response.data) {
        // Update to completed
        setItems((prev) => prev.map((p) => 
          p.id === item.id 
            ? { ...p, status: "uploaded", progress: 100 } 
            : p
        ));

        toast({
          title: "File uploaded successfully!",
          description: `${item.file.name} is ready for printing configuration.`,
        });

        // Notify parent component
        if (onFileUploaded) {
          onFileUploaded(response.data._id);
        }
      } else {
        throw new Error(response.message || "Failed to create print job");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setItems((prev) => prev.map((p) => 
        p.id === item.id 
          ? { ...p, status: "error", errorMessage } 
          : p
      ));

      toast({
        title: "Upload failed",
        description: `Failed to upload ${item.file.name}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  }, [user?.id, createPrintJobMutation, toast, onFileUploaded]);

  const validateFiles = useCallback((files: File[]) => {
    const valid: File[] = [];
    const rejected: { name: string; reason: string }[] = [];

    // Check max files limit
    const totalFiles = items.length + files.length;
    if (totalFiles > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed. Current: ${items.length}`,
        variant: "destructive",
      });
      return [];
    }

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        rejected.push({ name: file.name, reason: validation.error! });
        continue;
      }
      valid.push(file);
    }

    if (rejected.length > 0) {
      const sample = rejected.slice(0, 3).map((r) => `${r.name} (${r.reason})`).join("\n");
      toast({
        title: "Some files were rejected",
        description: `${rejected.length} file(s) rejected.\n${sample}${rejected.length > 3 ? "\n..." : ""}`,
        variant: "destructive",
      });
    }

    return valid;
  }, [items.length, maxFiles, validateFile, toast]);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files || !user?.id) return;
    
    const arr = Array.from(files);
    const valid = validateFiles(arr);

    if (!valid.length) return;

    // Create queue items
    const newItems: QueueItem[] = valid.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "queued"
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Start upload for each file
    newItems.forEach(uploadToCloudinary);
  }, [user?.id, validateFiles, uploadToCloudinary]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onFiles(e.dataTransfer.files);
  }, [onFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const retryUpload = useCallback((item: QueueItem) => {
    uploadToCloudinary(item);
  }, [uploadToCloudinary]);

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: QueueItem['status']) => {
    switch (status) {
      case 'uploaded':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'uploading':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Please sign in to upload files for printing.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-labelledby="upload-title" className="container py-8 animate-fade-in">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle id="upload-title" className="text-xl">
            Upload Files for Printing
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload up to {maxFiles} files. Supported formats: PDF, DOC, DOCX, Images, and more.
          </p>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`w-full rounded-md border-2 border-dashed p-8 text-center transition-colors bg-transparent ${
              isDragging ? "border-primary bg-muted/40" : "border-muted-foreground/30"
            }`}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mb-2">Drag and drop files here</p>
            <p className="text-sm text-muted-foreground mb-4">
              Maximum {formatBytes(MAX_FILE_SIZE)} per file
            </p>

            <div className="flex items-center justify-center gap-3">
              <Input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
                disabled={items.length >= maxFiles}
              />
              <Button 
                onClick={() => inputRef.current?.click()} 
                className="hover-scale"
                disabled={items.length >= maxFiles}
              >
                Browse Files
              </Button>
            </div>
            
            {items.length >= maxFiles && (
              <p className="text-sm text-amber-600 mt-2">
                Maximum file limit reached ({maxFiles} files)
              </p>
            )}
          </button>

          {items.length > 0 && (
            <div className="mt-6">
              <Separator className="mb-4" />
              <ul className="space-y-2">
                {items.map((item) => {
                  const Icon = getIconForFile(item.file);
                  return (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between rounded-md border p-3 animate-enter ${getStatusColor(item.status)}`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate max-w-[50vw] sm:max-w-md">
                            {item.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(item.file.size)}
                          </p>
                          {item.status === 'error' && item.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">
                              {item.errorMessage}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.status === 'uploading' && (
                            <div className="w-32">
                              <Progress 
                                value={item.progress} 
                                aria-label={`Uploading ${item.file.name}`} 
                              />
                              <p className="text-xs text-center mt-1">{item.progress}%</p>
                            </div>
                          )}
                          
                          {getStatusIcon(item.status)}
                          
                          {item.status === 'error' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryUpload(item)}
                              className="h-8"
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${item.file.name}`}
                        onClick={() => removeItem(item.id)}
                        disabled={item.status === 'uploading'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
