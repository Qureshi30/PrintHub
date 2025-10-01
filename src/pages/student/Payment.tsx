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
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  CheckCircle, 
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Upload,
  Settings
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
    getSessionFile,
    goToNextStep,
    setPaymentInfo
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
    },
    {
      id: "dev",
      name: "Dev Mode",
      description: "Development testing (always succeeds)",
      icon: Settings,
      popular: false,
      isDev: true
    }
  ];

  // Upload files to Cloudinary after payment
  const uploadFilesToCloudinary = async () => {
    setPaymentStatus("uploading");
    
    console.log('🔍 uploadFilesToCloudinary called - DEBUGGING');
    console.log('📁 Current files state:', files);
    
    // Add detailed debugging for each file
    console.log('=== FILE DEBUGGING START ===');
    files.forEach((file, index) => {
      const sessionFile = getSessionFile(file.id);
      console.log(`🔍 File ${index + 1}: ${file.name}`, {
        id: file.id,
        hasFileProperty: !!file.file,
        hasSessionFile: !!sessionFile,
        filePropertyType: file.file?.type,
        sessionFileType: sessionFile?.type,
        filePropertySize: file.file?.size,
        sessionFileSize: sessionFile?.size,
        cloudinaryUrl: file.cloudinaryUrl
      });
      
      if (!file.file && !sessionFile) {
        console.error(`❌ CRITICAL: File ${file.name} has NO file object and NO session file!`);
      }
    });
    console.log('=== FILE DEBUGGING END ===');
    
    try {
      const localFiles = files.filter(file => !file.cloudinaryUrl);
      
      console.log('📋 Upload Context Debug:', {
        totalFiles: files.length,
        localFilesCount: localFiles.length,
        allFiles: files.map(f => {
          const sessionFile = getSessionFile(f.id);
          return { 
            id: f.id, 
            name: f.name, 
            hasSessionFile: !!sessionFile,
            hasCloudinaryUrl: !!f.cloudinaryUrl,
            fileType: sessionFile?.type,
            fileSize: sessionFile?.size 
          };
        }),
        localFiles: localFiles.map(f => {
          const sessionFile = getSessionFile(f.id);
          return { 
            id: f.id, 
            name: f.name, 
            hasSessionFile: !!sessionFile,
            fileType: sessionFile?.type,
            fileSize: sessionFile?.size 
          };
        })
      });
      
      if (localFiles.length === 0) {
        console.log('ℹ️ All files already uploaded or no files to upload');
        await createPrintJobsInDatabase();
        return;
      }

      // Check if files have missing session files and try to recover from file property
      const filesWithoutAnyFile = localFiles.filter(f => {
        const sessionFile = getSessionFile(f.id);
        const fileProperty = f.file;
        console.log(`🔍 Checking file ${f.name}:`, {
          hasSessionFile: !!sessionFile,
          hasFileProperty: !!fileProperty,
          sessionFileType: sessionFile?.type,
          filePropertyType: fileProperty?.type
        });
        return !sessionFile && !fileProperty;
      });
      
      if (filesWithoutAnyFile.length > 0) {
        console.error('❌ Missing files detected (no session file or file property):', filesWithoutAnyFile.map(f => f.name));
        
        // In Dev Mode, show error message instead of failing silently
        if (selectedMethod === 'dev') {
          console.log('🔄 Dev Mode: Files missing, showing error');
          toast({
            title: "Files Missing",
            description: "Some files were lost during upload. Please go back and re-upload your files.",
            variant: "destructive",
          });
          setPaymentStatus("failed");
          return;
        } else {
          throw new Error('Files were corrupted during state management. Please refresh the page and re-upload your files.');
        }
      }

      // Report which files are using fallback
      const filesUsingFallback = localFiles.filter(f => !getSessionFile(f.id) && f.file);
      if (filesUsingFallback.length > 0) {
        console.log('⚠️ Using file property fallback for:', filesUsingFallback.map(f => f.name));
      }

      console.log(`📤 Uploading ${localFiles.length} files to Cloudinary...`);
      
      const uploadedFilesInfo: Array<{
        id: string;
        name: string;
        cloudinaryUrl: string;
        cloudinaryPublicId: string;
        format: string;
        sizeKB: number;
        originalSize: number;
      }> = [];
      
      for (const fileData of localFiles) {
        // Try session file first, then fallback to file property
        let sessionFile = getSessionFile(fileData.id);
        if (!sessionFile && fileData.file) {
          sessionFile = fileData.file;
          console.log(`🔄 Using file property fallback for ${fileData.name}`);
        }
        
        console.log('🔍 Processing file:', {
          fileId: fileData.id,
          fileName: fileData.name,
          hasSessionFile: !!getSessionFile(fileData.id),
          hasFileProperty: !!fileData.file,
          usingFallback: !getSessionFile(fileData.id) && !!fileData.file,
          fileType: sessionFile?.type,
          fileSize: sessionFile?.size,
          fileLastModified: sessionFile?.lastModified,
          fileConstructor: sessionFile?.constructor?.name
        });
        
        if (sessionFile) {
          setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }));
          
          try {
            console.log(`📤 About to upload file:`, sessionFile);
            console.log('🔍 File object detailed check in Payment.tsx:', {
              isFile: sessionFile instanceof File,
              constructor: sessionFile.constructor.name,
              hasArrayBuffer: typeof sessionFile.arrayBuffer === 'function',
              prototype: Object.getPrototypeOf(sessionFile),
              keys: Object.keys(sessionFile)
            });
            const response = await uploadFile(sessionFile);
            
            // Store uploaded file info
            uploadedFilesInfo.push({
              id: fileData.id,
              name: fileData.name,
              cloudinaryUrl: response.url,
              cloudinaryPublicId: response.publicId,
              format: response.format,
              sizeKB: response.sizeKB,
              originalSize: fileData.size
            });
            
            // Update file with Cloudinary data including format and size
            updateFileWithCloudinaryData(fileData.id, response.url, response.publicId, response.format, response.sizeKB);
            
            setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 }));
            
            console.log(`✅ Uploaded ${fileData.name}:`, response.url);
          } catch (error) {
            console.error(`❌ Failed to upload ${fileData.name}:`, error);
            throw error;
          }
        } else {
          console.error(`❌ No session file found for ${fileData.name}`);
        }
      }
      
      // Now create print jobs in the backend
      await createPrintJobsInDatabase(uploadedFilesInfo);
      
    } catch (error) {
      setPaymentStatus("failed");
      throw error;
    }
  };

  // Create print jobs in MongoDB after successful upload
  const createPrintJobsInDatabase = async (uploadedFiles?: Array<{
    id: string;
    name: string;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    format: string;
    sizeKB: number;
    originalSize: number;
  }>) => {
    try {
      console.log('📝 Creating print jobs in database...');
      
      // Debug: Check current files state
      console.log('🔍 Files state for print job creation:', {
        totalFiles: files.length,
        files: files.map(f => ({
          id: f.id,
          name: f.name,
          hasCloudinaryUrl: !!f.cloudinaryUrl,
          cloudinaryUrl: f.cloudinaryUrl,
          cloudinaryPublicId: f.cloudinaryPublicId,
          format: f.format,
          sizeKB: f.sizeKB
        }))
      });
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      if (!selectedPrinter?._id) {
        throw new Error('No printer selected');
      }

      // Create a print job for each file that was uploaded
      const filesToProcess = uploadedFiles || files.filter(file => file.cloudinaryUrl);
      console.log('📋 Files eligible for print job creation:', filesToProcess.length);
      
      if (uploadedFiles) {
        console.log('🔄 Using directly passed uploaded files info');
      } else {
        console.log('🔄 Using files from React state');
      }
      
      const printJobPromises = filesToProcess
        .map(async (fileData) => {
          const fileSettings = settings[fileData.id];
          const printJobData = {
            clerkUserId: userId,
            printerId: selectedPrinter._id,
            file: {
              cloudinaryUrl: fileData.cloudinaryUrl as string,
              publicId: fileData.cloudinaryPublicId as string,
              originalName: fileData.name,
              format: fileData.format || 'pdf',
              sizeKB: (() => {
                if ('originalSize' in fileData) return Math.round(fileData.originalSize / 1024);
                if ('size' in fileData) return Math.round((fileData as { size: number }).size / 1024);
                return 0;
              })()
            },
            settings: {
              pages: fileSettings?.pages || 'all',
              copies: fileSettings?.copies || 1,
              color: fileSettings?.color || false,
              duplex: fileSettings?.duplex || false,
              paperType: fileSettings?.paperType || 'A4'
            },
            payment: {
              status: 'paid' as const,
              method: selectedMethod,
              transactionId: selectedMethod === 'dev' ? `dev_txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` : `txn_${Date.now()}`,
              paidAt: new Date().toISOString()
            },
            cost: calculateTotalCost()
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
      if (selectedMethod === "dev") {
        // Dev Mode: Always succeed immediately
        console.log('🔧 Dev Mode: Payment automatically successful, uploading files...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Short delay for UX
        
        // Store payment info
        setPaymentInfo({
          method: 'dev',
          totalCost: calculateTotalCost(),
          breakdown: {
            baseCost: calculateTotalCost() * 0.8,
            colorCost: 0,
            paperCost: calculateTotalCost() * 0.2
          }
        });
        
        await uploadFilesToCloudinary();
        setPaymentStatus("success");
      } else if (selectedMethod === "upi") {
        // UPI Payment processing
        console.log('� Processing UPI payment...');
        // UPI payment integration - requires Razorpay/Stripe configuration
        // For now, simulate processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate payment result (currently always fails until .env is configured)
        const success = false; // Will be true when payment gateway is properly configured
        
        if (success) {
          setPaymentInfo({
            method: 'upi',
            totalCost: calculateTotalCost(),
            breakdown: {
              baseCost: calculateTotalCost() * 0.8,
              colorCost: 0,
              paperCost: calculateTotalCost() * 0.2
            }
          });
          await uploadFilesToCloudinary();
          setPaymentStatus("success");
        } else {
          throw new Error("UPI payment not configured. Please set up payment gateway in .env or use Dev Mode for testing.");
        }
      } else if (selectedMethod === "card") {
        // Credit/Debit Card payment processing
        console.log('💳 Processing card payment...');
        // Card payment integration - requires Razorpay/Stripe configuration
        // For now, simulate processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate payment result (currently always fails until .env is configured)
        const success = false; // Will be true when payment gateway is properly configured
        
        if (success) {
          setPaymentInfo({
            method: 'card',
            totalCost: calculateTotalCost(),
            breakdown: {
              baseCost: calculateTotalCost() * 0.8,
              colorCost: 0,
              paperCost: calculateTotalCost() * 0.2
            }
          });
          await uploadFilesToCloudinary();
          setPaymentStatus("success");
        } else {
          throw new Error("Card payment not configured. Please set up payment gateway in .env or use Dev Mode for testing.");
        }
      }
    } catch (error) {
      setPaymentStatus("failed");
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Processing Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment and uploading files.",
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
                  {files.filter(file => getSessionFile(file.id) || file.file).map((file) => (
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
                    const isDevMode = method.isDev;
                    
                    // Determine border/background classes
                    const selectedClasses = isDevMode 
                      ? "border-orange-500 bg-orange-50" 
                      : "border-blue-500 bg-blue-50";
                    const unselectedClasses = isDevMode 
                      ? "border-orange-200 hover:border-orange-300" 
                      : "border-gray-200 hover:border-gray-300";
                    
                    return (
                      <button
                        key={method.id}
                        className={`p-4 border rounded-lg transition-all w-full text-left ${
                          selectedMethod === method.id ? selectedClasses : unselectedClasses
                        }`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${isDevMode ? 'text-orange-600' : 'text-gray-600'}`} />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {method.name}
                                {method.popular && (
                                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                                )}
                                {isDevMode && (
                                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">DEV</Badge>
                                )}
                              </div>
                              <div className={`text-sm ${isDevMode ? 'text-orange-600' : 'text-muted-foreground'}`}>
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
                      </button>
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
            <Card className={selectedMethod === "dev" ? "border-orange-200 bg-orange-50/50" : "border-blue-200 bg-blue-50/50"}>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className={`w-6 h-6 border-2 ${selectedMethod === "dev" ? "border-orange-600" : "border-blue-600"} border-t-transparent rounded-full animate-spin`}></div>
                  <span className={`font-medium ${selectedMethod === "dev" ? "text-orange-800" : "text-blue-800"}`}>
                    {selectedMethod === "dev" ? "Dev Mode - Auto Processing..." : "Processing Payment..."}
                  </span>
                </div>
                <p className={`text-sm ${selectedMethod === "dev" ? "text-orange-700" : "text-blue-700"}`}>
                  {selectedMethod === "dev" 
                    ? "Using development mode for testing. Payment will automatically succeed."
                    : "Please wait while we process your payment. Do not close this window."
                  }
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
