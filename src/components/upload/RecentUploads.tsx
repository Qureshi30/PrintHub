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

export default function RecentUploads({ items, onDelete }: RecentUploadsProps) {
  const [view, setView] = useState<"grid" | "list">("grid");

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.createdAt - a.createdAt),
    [items]
  );

  return (
    <section aria-labelledby="recent-title" className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 id="recent-title" className="text-lg font-semibold tracking-tight">
          Recent uploads ({sorted.length})
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "grid" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <List className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">List</span>
          </Button>
        </div>
      </div>

      <Separator />

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <LayoutGrid className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No uploads yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your files will appear here once uploaded</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((item) => (
            <FileCard key={item.id} item={item} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((item) => (
            <div key={item.id} className="max-w-full">
              <FileCard item={item} onDelete={onDelete} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
