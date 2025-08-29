import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useUpload } from "@/context/UploadContext";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useBackendUpload } from "@/hooks/useBackendUpload";
import { UploadedItem } from "./types";
import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
  UploadCloud,
} from "lucide-react";

const ACCEPT = ".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.svg,.xlsx,.csv,.ppt,.pptx";

// Max file size (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Upload queue item
type QueueItem = {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "uploaded" | "error";
  cloudinaryUrl?: string;
  publicId?: string;
  createdAt?: number;
};

function formatBytes(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function getIconForFile(file: File) {
  const name = file.name.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|svg)$/.test(name)) return ImageIcon;
  if (/\.(pdf|doc|docx|txt|rtf|ppt|pptx)$/.test(name)) return FileText;
  if (/\.(csv|xlsx)$/.test(name)) return FileSpreadsheet;
  return FileIcon;
}

function isAllowedType(file: File) {
  const allowed = ACCEPT.split(",").map((s) => s.trim().toLowerCase());
  const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
  return allowed.includes(ext);
}

interface FileUploaderProps {
  readonly onFileUploaded?: (file: UploadedItem) => void;
}

export default function FileUploader({ onFileUploaded }: FileUploaderProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { registerOpenDialog } = useUpload();
  const { toast } = useToast();

  const { uploadFile } = useBackendUpload({
    onProgress: (progress) => {
      // Update progress for the current uploading item
      setItems((prev) => prev.map((item) => 
        item.status === "uploading" ? { ...item, progress: progress.percentage } : item
      ));
    },
    onSuccess: (response) => {
      // Mark item as uploaded and store Cloudinary data
      setItems((prev) => prev.map((item) => 
        item.status === "uploading" ? { 
          ...item, 
          status: "uploaded", 
          progress: 100,
          cloudinaryUrl: response.url,
          publicId: response.publicId,
          createdAt: Date.now()
        } : item
      ));
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setItems((prev) => prev.map((item) => 
        item.status === "uploading" ? { ...item, status: "error" } : item
      ));
    },
  });

  useEffect(() => {
    const openDialog = () => inputRef.current?.click();
    registerOpenDialog(openDialog);
  }, []);

  const startUpload = useCallback(async (qi: QueueItem) => {
    setItems((prev) => prev.map((p) => (p.id === qi.id ? { ...p, status: "uploading", progress: 0 } : p)));

    try {
      const response = await uploadFile(qi.file);
      
      // Create uploaded item for parent component
      const uploadedItem: UploadedItem = {
        id: qi.id,
        name: qi.file.name,
        size: qi.file.size,
        type: qi.file.type || qi.file.name.split(".").pop() || "file",
        url: response.url,
        isImage: /\.(png|jpg|jpeg|gif|svg)$/i.test(qi.file.name),
        createdAt: Date.now(),
        cloudinaryPublicId: response.publicId,
      };

      // Notify parent component about the uploaded file
      if (onFileUploaded) {
        onFileUploaded(uploadedItem);
      }

      toast({
        title: "Upload Successful",
        description: `${qi.file.name} has been uploaded to Cloudinary.`,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setItems((prev) => prev.map((p) => (p.id === qi.id ? { ...p, status: "error" } : p)));
      
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${qi.file.name}. Please check your connection and try again.`,
        variant: "destructive",
      });
    }
  }, [uploadFile, onFileUploaded, toast]);

  const validateFiles = useCallback((files: File[]) => {
    const valid: File[] = [];
    const rejected: { name: string; reason: string }[] = [];

    for (const f of files) {
      if (!isAllowedType(f)) {
        rejected.push({ name: f.name, reason: "Unsupported type" });
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        rejected.push({ name: f.name, reason: `Too large (> ${formatBytes(MAX_FILE_SIZE)})` });
        continue;
      }
      valid.push(f);
    }

    if (rejected.length) {
      const sample = rejected.slice(0, 3).map((r) => `${r.name} (${r.reason})`).join("\n");
      toast({
        title: "Some files were skipped",
        description: `${rejected.length} file(s) rejected.\n${sample}${rejected.length > 3 ? "\n…" : ""}`,
      });
    }

    return valid;
  }, [toast]);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const valid = validateFiles(arr);

    if (!valid.length) return;

    const next: QueueItem[] = valid.map((file) => ({ 
      id: crypto.randomUUID(), 
      file, 
      progress: 0, 
      status: "queued",
      createdAt: Date.now()
    }));
    setItems((prev) => [...prev, ...next]);

    // Start simulated upload for each
    next.forEach(startUpload);
  }, [startUpload, validateFiles]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onFiles(e.dataTransfer.files);
  }, [onFiles]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Remove expired items from queue
  useEffect(() => {
    const expiredItems = items.filter((item) => 
      item.status === "uploaded" && 
      item.createdAt && 
      Date.now() - item.createdAt > 5000
    );
    if (expiredItems.length > 0) {
      setItems((prev) => prev.filter((item) => 
        !expiredItems.some((expired) => expired.id === item.id)
      ));
    }
  }, [items]);

  const hasFiles = items.length > 0;

  return (
    <section aria-labelledby="upload-title" className="container py-8 animate-fade-in">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle id="upload-title" className="text-xl">Upload your files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            role="button"
            tabIndex={0}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                inputRef.current?.click();
              }
            }}
            className={`rounded-md border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-muted/40" : "border-muted-foreground/30"
            }`}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mb-2">Drag and drop files here</p>
            <p className="text-sm text-muted-foreground mb-4">PDF, DOC/DOCX, JPG, PNG, and more</p>

            <div className="flex items-center justify-center gap-3">
              <Input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
              <Button onClick={() => inputRef.current?.click()} className="hover-scale">Browse Files</Button>
            </div>
          </div>

          {hasFiles && (
            <div className="mt-6">
              <Separator className="mb-4" />
              <ul className="space-y-2">
                {items.map((item) => {
                  const Icon = getIconForFile(item.file);
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-md border p-3 bg-card animate-enter"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate max-w-[50vw] sm:max-w-md">{item.file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                        </div>
                        <div className="w-40">
                          {item.status !== "uploaded" && (
                            <Progress value={item.progress} aria-label={`Uploading ${item.file.name}`} />
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${item.file.name}`}
                        onClick={() => removeItem(item.id)}
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


