import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
  Upload,
} from "lucide-react";

const ACCEPT = ".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.svg,.xlsx,.csv,.ppt,.pptx";

// Max file size (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Local upload queue item
type LocalQueueItem = {
  id: string;
  file: File;
  status: "ready" | "error";
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

interface LocalFileUploaderProps {
  readonly onFileAdded?: (file: File) => Promise<void>;
}

export default function LocalFileUploader({ onFileAdded }: LocalFileUploaderProps) {
  const [items, setItems] = useState<LocalQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

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

    const next: LocalQueueItem[] = valid.map((file) => ({ 
      id: crypto.randomUUID(), 
      file, 
      status: "ready",
    }));
    
    setItems((prev) => [...prev, ...next]);

    // Notify parent component about added files
    next.forEach(async (item) => {
      if (onFileAdded) {
        try {
          await onFileAdded(item.file);
        } catch (error) {
          console.error('Error processing file:', error);
        }
      }
    });

    toast({
      title: "Files Added",
      description: `${valid.length} file(s) added for printing. They will be uploaded after payment.`,
    });
  }, [validateFiles, onFileAdded, toast]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    onFiles(e.dataTransfer.files);
  }, [onFiles]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="space-y-4">
      <Card
        className={`transition-colors duration-200 cursor-pointer ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-dashed hover:border-gray-400"
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Upload className="h-10 w-10 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Click to upload or drag and drop
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Files will be stored locally until payment is completed
          </p>
          <p className="text-xs text-gray-500">
            Supports: PDF, DOCX, PPTX, Images, XLSX up to {formatBytes(MAX_FILE_SIZE)}
          </p>
        </CardContent>
      </Card>

      <Input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}