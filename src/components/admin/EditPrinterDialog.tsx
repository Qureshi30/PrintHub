import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { printerService, PrinterStatus } from "@/services/printerService";
import { useAuth } from "@clerk/clerk-react";
import { RefreshCw } from "lucide-react";

interface Printer {
  _id: string;
  name: string;
  location: string;
  status: string;
}

interface EditPrinterDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onPrinterUpdated: () => void;
  readonly printer: Printer | null;
}

export function EditPrinterDialog({ open, onOpenChange, onPrinterUpdated, printer }: EditPrinterDialogProps) {
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<PrinterStatus>("online");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();

  // Update form when printer changes
  useEffect(() => {
    if (printer) {
      setLocation(printer.location);
      setStatus(printer.status as PrinterStatus);
    }
  }, [printer]);

  const handleUpdatePrinter = async () => {
    if (!printer) return;

    setIsUpdating(true);
    try {
      const token = await getToken();
      
      // Update location if changed
      if (location !== printer.location) {
        await printerService.updatePrinterLocation(printer._id, location, token);
      }

      // Update status if changed
      if (status !== printer.status) {
        await printerService.updatePrinterStatus(printer._id, status, token);
      }

      toast({
        title: "Printer Updated",
        description: `${printer.name} has been updated successfully.`,
      });

      onPrinterUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update printer",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!printer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Printer</DialogTitle>
          <DialogDescription>
            Update the location and status of {printer.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="printer-name">Printer Name</Label>
            <Input
              id="printer-name"
              value={printer.name}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Library - Ground Floor"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: PrinterStatus) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdatePrinter} 
            disabled={isUpdating || (!location || location === printer.location) && status === printer.status}
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Update Printer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}