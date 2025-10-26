import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  Printer,
  Settings,
  CheckCircle,
  Info
} from "lucide-react";

interface SpecialPaperAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  paperType: "A3" | "certificate" | "photo" | "cardstock";
  estimatedDelay: number; // in minutes
  files?: Array<{ name: string; pages: number; }>;
}

const paperTypeInfo = {
  A3: {
    name: "A3 Paper",
    description: "Large format paper (297 × 420 mm)",
    reason: "Requires manual paper loading and printer reconfiguration",
    icon: "📄",
    color: "text-blue-600 bg-blue-100"
  },
  certificate: {
    name: "Certificate Paper",
    description: "High-quality thick paper for certificates",
    reason: "Requires special paper tray and quality settings adjustment",
    icon: "🏆",
    color: "text-purple-600 bg-purple-100"
  },
  photo: {
    name: "Photo Paper",
    description: "High-gloss photo paper for images",
    reason: "Requires photo paper tray and ink quality optimization",
    icon: "📸",
    color: "text-green-600 bg-green-100"
  },
  cardstock: {
    name: "Cardstock",
    description: "Thick cardboard-like paper",
    reason: "Requires manual feeding and pressure adjustment",
    icon: "📇",
    color: "text-orange-600 bg-orange-100"
  }
};

export function SpecialPaperAlert({ 
  isOpen, 
  onClose, 
  onConfirm, 
  paperType, 
  estimatedDelay,
  files = []
}: SpecialPaperAlertProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const paperInfo = paperTypeInfo[paperType];
  
  const handleConfirm = async () => {
    setIsConfirming(true);
    
    // Store preference if user checked "don't show again"
    if (dontShowAgain) {
      localStorage.setItem(`hideSpecialPaperAlert_${paperType}`, "true");
    }
    
    // Simulate brief loading
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onConfirm();
    setIsConfirming(false);
  };

  const shouldShowAlert = (paperType: string) => {
    return !localStorage.getItem(`hideSpecialPaperAlert_${paperType}`);
  };

  // Don't show if user has disabled this alert
  if (!shouldShowAlert(paperType)) {
    useEffect(() => {
      onConfirm();
    }, [onConfirm]);
    return null;
  }

  const getDelayText = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const totalPages = files.reduce((sum, file) => sum + file.pages, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Special Paper Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Paper Type Info */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="text-2xl">{paperInfo.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{paperInfo.name}</h3>
                <Badge className={paperInfo.color} variant="secondary">
                  Special Handling
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{paperInfo.description}</p>
              <p className="text-sm">{paperInfo.reason}</p>
            </div>
          </div>

          {/* Delay Warning */}
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Expected Delay</p>
              <p className="text-sm text-yellow-700">
                Your print job may be delayed by approximately <strong>{getDelayText(estimatedDelay)}</strong>
              </p>
            </div>
          </div>



          {/* Job Summary */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Files to Print ({files.length})
                </h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span className="truncate max-w-xs">{file.name}</span>
                      <span className="text-muted-foreground">{file.pages} pages</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Total: {totalPages} pages
                </div>
              </div>
            </div>
          )}

          {/* Why the delay? */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Why the delay?
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Our staff needs to manually load the special paper</p>
              <p>• Printer settings require adjustment for optimal quality</p>
              <p>• Quality check ensures perfect results for your documents</p>
              <p>• Current queue position may affect timing</p>
            </div>
          </div>

          {/* What happens next */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              What happens next?
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>1. Your job will be queued for special paper handling</p>
              <p>2. Staff will be notified to prepare the printer</p>
              <p>3. You'll receive updates on job progress</p>
              <p>4. Pick up your documents when ready</p>
            </div>
          </div>

          {/* Don't show again option */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="dontShowAgain" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label 
              htmlFor="dontShowAgain" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't show this alert again for {paperInfo.name.toLowerCase()}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex-1"
            >
              {isConfirming ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Continue Anyway
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can monitor your job progress in the Print Queue
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
