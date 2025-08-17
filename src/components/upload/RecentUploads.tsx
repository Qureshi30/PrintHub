import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import FileCard from "./FileCard";
import { UploadedItem } from "./types";
import { LayoutGrid, List } from "lucide-react";

interface RecentUploadsProps {
  items: UploadedItem[];
  onDelete: (id: string, url?: string) => void;
}

// Displays recently uploaded files with a grid/list toggle
export default function RecentUploads({ items, onDelete }: RecentUploadsProps) {
  const [view, setView] = useState<"grid" | "list">("grid");

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.createdAt - a.createdAt),
    [items]
  );

  return (
    <section aria-labelledby="recent-title" className="container py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 id="recent-title" className="text-lg font-semibold tracking-tight">
          Recent uploads
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "grid" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="mb-6" />

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No uploads yet. Your files will appear here once uploaded.</p>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((item) => (
            <FileCard key={item.id} item={item} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {sorted.map((item) => (
            <div key={item.id} className="grid grid-cols-1">
              <FileCard item={item} onDelete={onDelete} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
