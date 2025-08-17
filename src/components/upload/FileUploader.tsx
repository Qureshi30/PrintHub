import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useUpload } from "@/context/UploadContext";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import RecentUploads from "./RecentUploads";
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

function isAllowedType(file: File) {
  const allowed = ACCEPT.split(",").map((s) => s.trim().toLowerCase());
  const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
  return allowed.includes(ext);
}

export default function FileUploader({ onFileUploaded }: { onFileUploaded?: (file: UploadedItem) => void }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [recent, setRecent] = useState<UploadedItem[]>(() => dummyRecent()); // seed with dummy data
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { registerOpenDialog } = useUpload();
  const { toast } = useToast();

  // Keep interval timers for each uploading item
  const uploadTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    registerOpenDialog(() => inputRef.current?.click());
  }, [registerOpenDialog]);

  const startUpload = useCallback((qi: QueueItem) => {
    setItems((prev) => prev.map((p) => (p.id === qi.id ? { ...p, status: "uploading" } : p)));

    const tick = () => {
      setItems((prev) => {
        return prev.map((p) => {
          if (p.id !== qi.id) return p;
          const inc = Math.min(8 + Math.random() * 12, 100 - p.progress);
          const next = Math.min(100, Math.round(p.progress + inc));
          if (next >= 100) {
            // Done: move to recent list
            queueMicrotask(() => finalizeUpload(p));
          }
          return { ...p, progress: next };
        });
      });
    };

    const id = window.setInterval(tick, 350);
    uploadTimers.current[qi.id] = id;
  }, []);

  const finalizeUpload = useCallback((item: QueueItem) => {
    // Stop timer
    const t = uploadTimers.current[item.id];
    if (t) {
      clearInterval(t);
      delete uploadTimers.current[item.id];
    }
    // Mark as uploaded in queue
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "uploaded", progress: 100 } : p)));

    // Create object URL for preview/download
    const url = URL.createObjectURL(item.file);
    const isImage = /\.(png|jpg|jpeg|gif|svg)$/i.test(item.file.name);

    const uploaded: UploadedItem = {
      id: item.id,
      name: item.file.name,
      size: item.file.size,
      type: item.file.type || item.file.name.split(".").pop() || "file",
      url,
      isImage,
      createdAt: Date.now(),
    };

    setRecent((prev) => [uploaded, ...prev]);
    
    // Notify parent component about the uploaded file
    if (onFileUploaded) {
      onFileUploaded(uploaded);
    }
  }, [onFileUploaded]);

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

    const next: QueueItem[] = valid.map((file) => ({ id: crypto.randomUUID(), file, progress: 0, status: "queued" }));
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
    // If uploading, stop timer
    const t = uploadTimers.current[id];
    if (t) {
      clearInterval(t);
      delete uploadTimers.current[id];
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const deleteRecent = useCallback((id: string, url?: string) => {
    if (url) URL.revokeObjectURL(url);
    setRecent((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Cleanup created object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(uploadTimers.current).forEach((t) => clearInterval(t));
      setRecent((prev) => {
        prev.forEach((i) => URL.revokeObjectURL(i.url));
        return prev;
      });
    };
  }, []);

  const hasFiles = items.length > 0;

  return (
    <section aria-labelledby="upload-title" className="container py-8 animate-fade-in">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle id="upload-title" className="text-xl">Upload your files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`rounded-md border-2 border-dashed p-8 text-center transition-colors ${
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

      {/* Recently uploaded files section */}
      <RecentUploads items={recent} onDelete={deleteRecent} />
    </section>
  );
}

function dummyRecent(): UploadedItem[] {
  // Minimal dummy items for initial UI demonstration
  const now = Date.now();
  const mk = (name: string, size: number, type: string, isImage = false): UploadedItem => ({
    id: crypto.randomUUID(),
    name,
    size,
    type,
    url: isImage ? `https://picsum.photos/seed/${encodeURIComponent(name)}/600/400` : `data:text/plain,Demo`,
    isImage,
    createdAt: now - Math.floor(Math.random() * 1000 * 60 * 60),
  });
  return [
    mk("proposal.pdf", 1_245_123, "application/pdf"),
    mk("invoice.xlsx", 854_223, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    mk("product-shot.jpg", 2_450_331, "image/jpeg", true),
  ];
}
