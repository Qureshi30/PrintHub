import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, File as FileIcon, Trash2 } from "lucide-react";
import { UploadedItem } from "./types";

interface FileCardProps {
  item: UploadedItem;
  onDelete: (id: string, url?: string) => void;
}

export default function FileCard({ item, onDelete }: FileCardProps) {
  const { id, name, size, type, url, isImage } = item;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-4">
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
              <FileIcon className="h-12 w-12 mb-2" />
              <span className="text-xs font-medium">{type.toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="truncate text-sm font-medium" title={name}>{name}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(size)}</p>
        </div>

        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={url} download={name} aria-label={`Download ${name}`} className="flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              <span className="text-xs">Download</span>
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 px-3"
            onClick={() => onDelete(id, url)}
            aria-label={`Delete ${name}`}
          >
            <Trash2 className="h-4 w-4" />
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
