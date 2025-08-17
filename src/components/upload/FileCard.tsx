import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, File as FileIcon, Trash2 } from "lucide-react";
import { UploadedItem } from "./types";

interface FileCardProps {
  item: UploadedItem;
  onDelete: (id: string, url?: string) => void;
}

// Reusable card for a single uploaded file (image preview when available)
export default function FileCard({ item, onDelete }: FileCardProps) {
  const { id, name, size, type, url, isImage } = item;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="aspect-video w-full overflow-hidden rounded-md bg-muted flex items-center justify-center">
          {isImage ? (
            // Optimized image preview with lazy loading
            <img
              src={url}
              alt={`${name} preview`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <FileIcon className="h-10 w-10 mb-2" />
              <span className="text-xs">{type.toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="truncate text-sm font-medium" title={name}>{name}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(size)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          <Button variant="secondary" size="default" className="w-full" asChild>
            <a href={url} download={name} aria-label={`Download ${name}`} className="flex items-center justify-center">
              <Download className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Download</span>
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onDelete(id, url)}
            aria-label={`Delete ${name}`}
          >
            <Trash2 className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Delete</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
