import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { useNavigate } from "react-router-dom";
import { Printer, Clock, Users, CheckCircle } from "lucide-react";

interface PrinterStation {
  id: string;
  name: string;
  location: string;
  queueLength: number;
  estimatedWait: number; // in minutes
  status: "online" | "offline" | "maintenance";
  capabilities: {
    color: boolean;
    duplex: boolean;
    paperSizes: string[];
  };
}

const mockPrinters: PrinterStation[] = [
  {
    id: "1",
    name: "Library Ground Floor",
    location: "Main Library - Entrance",
    queueLength: 3,
    estimatedWait: 8,
    status: "online",
    capabilities: {
      color: true,
      duplex: true,
      paperSizes: ["A4", "A3", "Letter"]
    }
  },
  {
    id: "2", 
    name: "Computer Lab 1",
    location: "Engineering Block - Lab 101",
    queueLength: 0,
    estimatedWait: 0,
    status: "online",
    capabilities: {
      color: false,
      duplex: true,
      paperSizes: ["A4", "Letter"]
    }
  },
  {
    id: "3",
    name: "Student Center",
    location: "Main Building - Ground Floor",
    queueLength: 7,
    estimatedWait: 18,
    status: "online",
    capabilities: {
      color: true,
      duplex: false,
      paperSizes: ["A4", "Letter"]
    }
  },
  {
    id: "4",
    name: "Administrative Office",
    location: "Admin Block - Reception",
    queueLength: 2,
    estimatedWait: 5,
    status: "maintenance",
    capabilities: {
      color: true,
      duplex: true,
      paperSizes: ["A4", "A3", "Letter", "Legal"]
    }
  }
];

export default function SelectPrinter() {
  const navigate = useNavigate();
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedPrinter) {
      navigate("/confirmation");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "offline": return "bg-red-500";
      case "maintenance": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getQueueColor = (queueLength: number) => {
    if (queueLength === 0) return "text-green-600";
    if (queueLength <= 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <PrintFlowBreadcrumb currentStep="/select-printer" />
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Select Printer Station
            </h1>
            <p className="text-muted-foreground">
              Choose from available printer stations
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {mockPrinters.map((printer) => (
              <Card 
                key={printer.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedPrinter === printer.id ? "ring-2 ring-blue-500 bg-blue-50/50" : ""
                } ${printer.status !== "online" ? "opacity-60" : ""}`}
                onClick={() => printer.status === "online" && setSelectedPrinter(printer.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        {printer.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {printer.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(printer.status)}`} />
                      <Badge variant={printer.status === "online" ? "default" : "secondary"}>
                        {printer.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Queue Information */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-medium ${getQueueColor(printer.queueLength)}`}>
                        {printer.queueLength} in queue
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        ~{printer.estimatedWait} min wait
                      </span>
                    </div>
                  </div>

                  {/* Queue Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Queue Load</span>
                      <span>{Math.min(printer.queueLength * 10, 100)}%</span>
                    </div>
                    <Progress value={Math.min(printer.queueLength * 10, 100)} className="h-2" />
                  </div>

                  {/* Capabilities */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Capabilities:</div>
                    <div className="flex flex-wrap gap-1">
                      {printer.capabilities.color && (
                        <Badge variant="outline" className="text-xs">Color</Badge>
                      )}
                      {printer.capabilities.duplex && (
                        <Badge variant="outline" className="text-xs">Duplex</Badge>
                      )}
                      {printer.capabilities.paperSizes.map(size => (
                        <Badge key={size} variant="outline" className="text-xs">{size}</Badge>
                      ))}
                    </div>
                  </div>

                  {selectedPrinter === printer.id && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Selected</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              Back to Settings
            </Button>
            <Button 
              onClick={handleContinue} 
              disabled={!selectedPrinter}
              className="flex-1 bg-gradient-hero"
            >
              Continue to Confirmation
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
