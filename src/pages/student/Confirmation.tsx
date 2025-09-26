import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { useNavigate } from "react-router-dom";
import { usePrintJobContext } from "@/hooks/usePrintJobContext";
import { 
  FileText, 
  Printer, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  DollarSign
} from "lucide-react";

interface JobSummary {
  file: {
    name: string;
    pages: number;
    size: string;
  };
  settings: {
    pageRange: string;
    colorMode: string;
    duplex: string;
    copies: number;
    paperSize: string;
    paperType: string;
  };
  printer: {
    name: string;
    location: string;
    queueLength: number;
    estimatedWait: number;
  };
  cost: {
    total: number;
    breakdown: string;
  };
}

export default function Confirmation() {
  const navigate = useNavigate();
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobSummary, setJobSummary] = useState<JobSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use PrintJob context instead of sessionStorage
  const { files, settings, selectedPrinter, setCurrentStep } = usePrintJobContext();

  useEffect(() => {
    // Set current step to confirm
    setCurrentStep('confirm');
    
    // Load data from PrintJob context
    console.log('🔍 Loading confirmation data from context...');
    console.log('📄 Context data:', { files, settings, selectedPrinter });
    
    // Check if we have the minimum required data
    if (files.length > 0 && selectedPrinter) {
      // Normal flow with selected files
      const firstFile = files[0];
      const firstFileSettings = settings[firstFile.id] || {
        pages: 'all',
        copies: 1,
        color: false,
        duplex: false,
        paperType: 'A4'
      };
      
      // Calculate actual cost (₹1 per page)
      const pages = firstFile.pages || 1;
      const copies = firstFileSettings.copies || 1;
      const totalCost = pages * copies * 1.00; // ₹1 per page
      
      setJobSummary({
        file: {
          name: firstFile.name || "Document",
          pages: pages,
          size: `${(firstFile.size / 1024 / 1024).toFixed(1)} MB`
        },
        settings: {
          pageRange: firstFileSettings.pages === 'all' ? 'All pages' : `Pages ${firstFileSettings.pages}`,
          colorMode: firstFileSettings.color ? 'Color' : 'Black & White',
          duplex: firstFileSettings.duplex ? 'Double-sided' : 'Single-sided',
          copies: copies,
          paperSize: firstFileSettings.paperType || 'A4',
          paperType: 'Regular'
        },
        printer: {
          name: selectedPrinter.name || 'Unknown Printer',
          location: selectedPrinter.location || 'Unknown Location',
          queueLength: selectedPrinter.queueLength || 0,
          estimatedWait: selectedPrinter.estimatedWait || 0
        },
        cost: {
          total: totalCost,
          breakdown: `${pages} pages × ${copies} copies × ₹1.00 = ₹${totalCost.toFixed(2)}`
        }
      });
    } else if (selectedPrinter) {
      // We have a printer but no files - create a demo/placeholder job summary
      console.log('⚠️ Found printer but no files - creating placeholder summary');
      setJobSummary({
        file: {
          name: "No Document Selected",
          pages: 0,
          size: "0 MB"
        },
        settings: {
          pageRange: 'No pages',
          colorMode: 'Black & White',
          duplex: 'Single-sided',
          copies: 1,
          paperSize: 'A4',
          paperType: 'Regular'
        },
        printer: {
          name: selectedPrinter.name || 'Unknown Printer',
          location: selectedPrinter.location || 'Unknown Location',
          queueLength: selectedPrinter.queueLength || 0,
          estimatedWait: selectedPrinter.estimatedWait || 0
        },
        cost: {
          total: 0,
          breakdown: 'No document to print'
        }
      });
    } else {
      console.log('❌ Missing context data - redirecting to upload');
      // If no valid context data, redirect to upload page after a brief moment
      setTimeout(() => {
        navigate('/upload');
      }, 2000); // Increased delay to allow user to see the message
    }
    
    // Set loading to false after data processing
    setIsLoading(false);
  }, [files, settings, selectedPrinter, setCurrentStep, navigate]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p>Loading job details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!jobSummary) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto" />
            <h2 className="text-xl font-semibold">No Print Job Found</h2>
            <p className="text-muted-foreground">
              No print job data found. Please start from uploading a document.
            </p>
            <div className="text-sm text-gray-600 mb-4">
              Redirecting to upload page in a moment...
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/upload')} className="bg-blue-600 hover:bg-blue-700">
                Upload Document Now
              </Button>
              <Button onClick={() => navigate('/settings')} variant="outline">
                Back to Settings
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];

  const handleSubmit = async () => {
    // Prevent submission if no document is selected
    if (jobSummary.file.pages === 0) {
      navigate('/upload');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    
    // Navigate to payment or queue based on cost
    if (jobSummary.cost.total > 0) {
      navigate("/payment");
    } else {
      navigate("/queue");
    }
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) return "Submitting...";
    if (jobSummary.file.pages === 0) return "Upload Document First";
    return jobSummary.cost.total > 0 ? "Submit Print Job & Pay" : "Submit Print Job";
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <PrintFlowBreadcrumb currentStep="/confirmation" />
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Confirm Print Job
            </h1>
            <p className="text-muted-foreground">
              Review your settings before submitting
            </p>
          </div>

          {/* No Document Warning */}
          {jobSummary.file.pages === 0 && (
            <div className="mb-6">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>No document selected!</strong> You need to upload a document before you can proceed with printing. 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-semibold text-yellow-800 underline ml-1"
                    onClick={() => navigate('/upload')}
                  >
                    Upload a document now
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Job Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* File Details */}
            <Card className={jobSummary.file.pages === 0 ? 'opacity-60' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Document Details
                  {jobSummary.file.pages === 0 && (
                    <Badge variant="secondary" className="text-xs">No Document</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Name:</span>
                  <span className={`font-medium ${jobSummary.file.pages === 0 ? 'text-gray-500' : ''}`}>
                    {jobSummary.file.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pages:</span>
                  <span className={jobSummary.file.pages === 0 ? 'text-gray-500' : ''}>
                    {jobSummary.file.pages || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size:</span>
                  <span className={jobSummary.file.pages === 0 ? 'text-gray-500' : ''}>
                    {jobSummary.file.size}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Page Range:</span>
                    <span>{jobSummary.settings.pageRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color:</span>
                    <span>{jobSummary.settings.colorMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sides:</span>
                    <span>{jobSummary.settings.duplex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Copies:</span>
                    <span>{jobSummary.settings.copies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paper:</span>
                    <span>{jobSummary.settings.paperSize} {jobSummary.settings.paperType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Printer & Cost */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-green-600" />
                  Printer & Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Station:</span>
                  <span className="font-medium">{jobSummary.printer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-sm">{jobSummary.printer.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Queue:</span>
                  <Badge variant="secondary">{jobSummary.printer.queueLength} jobs ahead</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wait Time:</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{jobSummary.printer.estimatedWait} min
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost Breakdown:</span>
                  </div>
                  <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                    {jobSummary.cost.breakdown}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Cost:</span>
                    <span className="text-xl font-bold text-green-600">
                      ₹{jobSummary.cost.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scheduling Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Schedule Print (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Schedule for later</Label>
                  <div className="text-sm text-muted-foreground">
                    Choose a time slot to avoid peak hours
                  </div>
                </div>
                <Switch 
                  checked={isScheduled}
                  onCheckedChange={setIsScheduled}
                />
              </div>
              
              {isScheduled && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTimeSlot === slot ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTimeSlot(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              )}
              
              {isScheduled && selectedTimeSlot && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      Scheduled for {selectedTimeSlot} today
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          {jobSummary.cost.total > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  Payment Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">
                    Payment of ₹{jobSummary.cost.total.toFixed(2)} will be processed via UPI
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  You'll be redirected to secure payment after confirming this job.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Please ensure your document settings are correct. Changes cannot be made after submission.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Back to Settings
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1 bg-gradient-hero"
              disabled={isSubmitting || (isScheduled && !selectedTimeSlot) || jobSummary.file.pages === 0}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                getSubmitButtonText()
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
