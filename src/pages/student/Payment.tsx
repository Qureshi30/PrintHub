import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { useNavigate } from "react-router-dom";
import { usePrintJobContext } from "@/hooks/usePrintJobContext";
import { useBackendUpload } from "@/hooks/useBackendUpload";
import { useCreatePrintJob } from "@/hooks/useDatabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";
import AuthDebugger from "@/components/debug/AuthDebugger";
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  CheckCircle, 
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Upload
} from "lucide-react";

export default function Payment() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [fileId: string]: number }>({});
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "uploading" | "success" | "failed">("pending");

  // Get data from print job flow context
  const { 
    files, 
    settings, 
    selectedPrinter, 
    updateFileWithCloudinaryData,
    goToNextStep 
  } = usePrintJobContext();

  // Hooks for backend operations
  const { mutateAsync: createPrintJob } = useCreatePrintJob();

  // Upload hook for Cloudinary upload
  const { uploadFile } = useBackendUpload({
    onProgress: (progress) => {
      // Update progress for current file being uploaded
    },
    onSuccess: (response) => {
      console.log('📤 File uploaded successfully:', response);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate total cost from files and settings
  const calculateTotalCost = () => {
    let total = 0;
    files.forEach(file => {
      const fileSettings = settings[file.id];
      if (fileSettings) {
        const baseCost = 0.10; // $0.10 per page
        const colorMultiplier = fileSettings.color ? 2 : 1;
        const pages = file.pages;
        const copies = fileSettings.copies;
        total += baseCost * colorMultiplier * pages * copies;
      }
    });
    return total;
  };

  const paymentInfo = {
    amount: calculateTotalCost(),
    fileCount: files.length,
    totalPages: files.reduce((sum, file) => sum + file.pages, 0),
    printerName: selectedPrinter?.name || "Unknown Printer",
    jobId: `PJ-${Date.now()}`, // Generate a job ID
    fileName: files.length === 1 ? files[0].name : `${files.length} files`,
    breakdown: `${files.reduce((sum, file) => sum + file.pages, 0)} pages × ${files.length} file${files.length !== 1 ? 's' : ''}`
  };

  const paymentMethods = [
    {
      id: "upi",
      name: "UPI Payment",
      description: "Pay using Google Pay, PhonePe, Paytm",
      icon: Smartphone,
      popular: true
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Visa, Mastercard, RuPay",
      icon: CreditCard,
      popular: false
    }
  ];

  // Upload files to Cloudinary after payment
  const uploadFilesToCloudinary = async () => {
    setPaymentStatus("uploading");
    
    try {
      const localFiles = files.filter(file => file.file && !file.cloudinaryUrl);
      
      console.log('📋 Upload Context Debug:', {
        totalFiles: files.length,
        localFilesCount: localFiles.length,
        allFiles: files.map(f => ({ 
          id: f.id, 
          name: f.name, 
          hasFile: !!f.file,
          hasCloudinaryUrl: !!f.cloudinaryUrl,
          fileType: f.file?.type,
          fileSize: f.file?.size 
        })),
        localFiles: localFiles.map(f => ({ 
          id: f.id, 
          name: f.name, 
          hasFile: !!f.file,
          fileType: f.file?.type,
          fileSize: f.file?.size 
        }))
      });
      
      if (localFiles.length === 0) {
        console.log('❌ No local files to upload - this might be the issue!');
        console.log('All files in context:', files);
        return;
      }

      console.log(`📤 Uploading ${localFiles.length} files to Cloudinary...`);
      
      for (const fileData of localFiles) {
        console.log('🔍 Processing file:', {
          fileId: fileData.id,
          fileName: fileData.name,
          hasFile: !!fileData.file,
          fileType: fileData.file?.type,
          fileSize: fileData.file?.size,
          fileLastModified: fileData.file?.lastModified,
          fileConstructor: fileData.file?.constructor?.name
        });
        
        if (fileData.file) {
          setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }));
          
          try {
            console.log(`📤 About to upload file:`, fileData.file);
            const response = await uploadFile(fileData.file);
            
            // Update file with Cloudinary data
            updateFileWithCloudinaryData(fileData.id, response.url, response.publicId);
            
            setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 }));
            
            console.log(`✅ Uploaded ${fileData.name}:`, response.url);
          } catch (error) {
            console.error(`❌ Failed to upload ${fileData.name}:`, error);
            throw error;
          }
        } else {
          console.error(`❌ No file object found for ${fileData.name}`);
        }
      }
      
      // Now create print jobs in the backend
      await createPrintJobsInDatabase();
      
    } catch (error) {
      setPaymentStatus("failed");
      throw error;
    }
  };

  // Create print jobs in MongoDB after successful upload
  const createPrintJobsInDatabase = async () => {
    try {
      console.log('📝 Creating print jobs in database...');
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      if (!selectedPrinter?._id) {
        throw new Error('No printer selected');
      }

      // Create a print job for each file that was uploaded
      const printJobPromises = files
        .filter(file => file.file && file.cloudinaryUrl) // Only files that have been uploaded
        .map(async (fileData) => {
          const fileSettings = settings[fileData.id];
          const printJobData = {
            clerkUserId: userId,
            printerId: selectedPrinter._id,
            file: {
              cloudinaryUrl: fileData.cloudinaryUrl as string,
              publicId: fileData.cloudinaryPublicId as string,
              originalName: fileData.name,
              format: fileData.file!.type.split('/')[1] || 'pdf',
              sizeKB: Math.round(fileData.file!.size / 1024)
            },
            settings: {
              pages: fileSettings?.pages || 'all',
              copies: fileSettings?.copies || 1,
              color: fileSettings?.color || false,
              duplex: fileSettings?.duplex || false,
              paperType: fileSettings?.paperType || 'A4'
            }
          };

          console.log('📄 Creating print job for:', fileData.name);
          return await createPrintJob(printJobData);
        });

      const createdJobs = await Promise.all(printJobPromises);
      console.log('✅ Successfully created print jobs:', createdJobs.length);
      
      toast({
        title: "Success!",
        description: `${createdJobs.length} print job(s) created successfully`,
      });
      
      goToNextStep(); // Move to queue step
    } catch (error) {
      console.error('❌ Failed to create print jobs:', error);
      toast({
        title: "Database Error",
        description: "Failed to create print jobs in database. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    setPaymentStatus("processing");
    
    try {
      // TODO: Replace with actual payment processing when payment gateway is integrated
      // For now, simulate payment processing with guaranteed success
      console.log('💳 Simulating payment processing (always successful for development)...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Shorter delay for development
      
      // DEVELOPMENT MODE: Always succeed (remove this when real payment is implemented)
      const DEVELOPMENT_MODE = true; // Set to false when implementing real payments
      const success = DEVELOPMENT_MODE ? true : Math.random() > 0.1;
      
      if (success) {
        console.log('✅ Payment simulation successful, uploading files...');
        // Payment successful, now upload files to Cloudinary
        await uploadFilesToCloudinary();
        setPaymentStatus("success");
      } else {
        setPaymentStatus("failed");
      }
    } catch (error) {
      setPaymentStatus("failed");
      toast({
        title: "Payment Processing Failed",
        description: "There was an error processing your payment and uploading files.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const retryPayment = () => {
    setPaymentStatus("pending");
    setIsProcessing(false);
  };

  if (paymentStatus === "uploading") {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-blue-600">Uploading Files...</h1>
            <p className="text-muted-foreground">
              Payment successful! Now uploading your files to prepare your print job.
            </p>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {files.filter(file => file.file).map((file) => (
                    <div key={file.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{file.name}</span>
                      <div className="flex items-center gap-2">
                        {uploadProgress[file.id] === 100 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {uploadProgress[file.id] || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              Please don't close this page while files are uploading...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (paymentStatus === "success") {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your print job has been submitted to the queue.
            </p>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Job ID:</span>
                    <span className="font-medium">{paymentInfo.jobId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-medium text-green-600">${paymentInfo.amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button onClick={() => navigate("/queue")} className="bg-gradient-hero">
              Track Your Print Job
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-red-600">Payment Failed</h1>
            <p className="text-muted-foreground">
              We couldn't process your payment. Please try again.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate("/confirmation")} className="flex-1">
                Back to Confirmation
              </Button>
              <Button onClick={retryPayment} className="flex-1 bg-gradient-hero">
                Retry Payment
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <PrintFlowBreadcrumb currentStep="/payment" />
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Payment
            </h1>
            <p className="text-muted-foreground">
              Complete your payment to submit the print job
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Print Job:</span>
                  <span className="font-medium">{paymentInfo.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Job ID:</span>
                  <Badge variant="secondary">{paymentInfo.jobId}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Cost Breakdown:</div>
                  <div className="text-sm bg-gray-50 p-2 rounded">
                    {paymentInfo.breakdown}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${paymentInfo.amount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div 
                        key={method.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all w-full text-left ${
                          selectedMethod === method.id 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {method.name}
                                {method.popular && (
                                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {method.description}
                              </div>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedMethod === method.id 
                              ? "border-blue-500 bg-blue-500" 
                              : "border-gray-300"
                          }`}>
                            {selectedMethod === method.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedMethod && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Secure Payment</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Your payment is secured with bank-grade encryption and processed by Razorpay.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Processing */}
          {paymentStatus === "processing" && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium text-blue-800">Processing Payment...</span>
                </div>
                <p className="text-sm text-blue-700">
                  Please wait while we process your payment. Do not close this window.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="flex-1"
              disabled={isProcessing}
            >
              Back
            </Button>
            <Button 
              onClick={handlePayment} 
              className="flex-1 bg-gradient-hero"
              disabled={!selectedMethod || isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pay ${paymentInfo.amount.toFixed(2)}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
