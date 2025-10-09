import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { printerService } from "@/services/printerService";
import { useAuth } from "@clerk/clerk-react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Printer {
  _id: string;
  name: string;
  location: string;
  status: string;
}

interface DeletePrinterDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onPrinterDeleted: () => void;
  readonly printer: Printer | null;
}

export function DeletePrinterDialog({ open, onOpenChange, onPrinterDeleted, printer }: DeletePrinterDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();

  const handleDeletePrinter = async () => {
    if (!printer) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      
      await printerService.deletePrinter(printer._id, token);

      toast({
        title: "Printer Deleted",
        description: `${printer.name} has been deleted successfully.`,
      });

      onPrinterDeleted();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete printer",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!printer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Printer
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{printer.name}</strong>? This action cannot be undone.
            All associated print jobs and history will be preserved but the printer will no longer be available for new jobs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Warning</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              This will permanently remove the printer from the system. Any pending print jobs will be cancelled.
            </p>
          </div>

          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">Printer:</span> {printer.name}
            </div>
            <div className="text-sm">
              <span className="font-medium">Location:</span> {printer.location}
            </div>
            <div className="text-sm">
              <span className="font-medium">Status:</span> {printer.status}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDeletePrinter} 
            disabled={isDeleting}
          >
            {isDeleting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            {isDeleting ? 'Deleting...' : 'Delete Printer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
