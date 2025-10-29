import { useState, useEffect } from "react";
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
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Upload,
  Settings
} from "lucide-react";

// Razorpay interface
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

export default function Payment() {
  const navigate = useNavigate();
  const { userId, getToken } = useAuth();
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
    setPaymentInfo,
    cleanupLocalFiles,
    payment
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

  // Log payment context on mount and when it changes
  useEffect(() => {
    console.log('🔄 PAYMENT - Component mounted/payment changed');
    console.log('🔄 PAYMENT - Current payment:', payment);
    console.log('🔄 PAYMENT - Files:', files);
    console.log('🔄 PAYMENT - Settings:', settings);
  }, [payment, files, settings]);


  // Calculate total cost from files and settings
  const calculateTotalCost = () => {
    console.log('💰 PAYMENT - calculateTotalCost called');
    console.log('💰 PAYMENT - payment context:', payment);
    console.log('💰 PAYMENT - files:', files);
    console.log('💰 PAYMENT - settings:', settings);

    // Use backend-calculated total from payment context if available
    if (payment?.totalCost) {
      console.log('✅ PAYMENT - Using payment.totalCost:', payment.totalCost);
      return payment.totalCost;
    }

    console.log('⚠️ PAYMENT - No payment.totalCost, calculating from files...');

    // Fallback calculation if backend total not available
    let total = 0;
    files.forEach(file => {
      const fileSettings = settings[file.id];
      console.log(`📄 PAYMENT - Processing file ${file.name}:`, {
        hasSettings: !!fileSettings,
        settings: fileSettings,
        pages: file.pages
      });

      if (fileSettings) {
        const blackAndWhiteRate = 2.00; // ₹2.00 per page for B&W
        const colorRate = 5.00; // ₹5.00 per page for color
        const baseCost = fileSettings.color ? colorRate : blackAndWhiteRate;
        const pages = file.pages || 1;
        const copies = fileSettings.copies || 1;
        const fileCost = baseCost * pages * copies;

        console.log(`💵 PAYMENT - File cost: ${fileCost} (${baseCost}/page × ${pages} pages × ${copies} copies)`);
        total += fileCost;
      }
    });

    console.log('💰 PAYMENT - Total calculated:', total);
    return total;
  };

  const calculatedAmount = calculateTotalCost();
  const safeAmount = isNaN(calculatedAmount) || calculatedAmount === undefined ? 0 : calculatedAmount;

  console.log('💰 PAYMENT - Final amount:', { calculatedAmount, safeAmount });

  const paymentInfo = {
    amount: safeAmount,
    fileCount: files.length,
    totalPages: files.reduce((sum, file) => sum + file.pages, 0),
    printerName: selectedPrinter?.name || "Unknown Printer",
    jobId: `PJ-${Date.now()}`, // Generate a job ID
    fileName: files.length === 1 ? files[0].name : `${files.length} files`,
    breakdown: `${files.reduce((sum, file) => sum + file.pages, 0)} pages × ${files.length} file${files.length !== 1 ? 's' : ''}`
  };

  const paymentMethods = [
    {
      id: "razorpay",
      name: "Online Payment (Razorpay)",
      description: "UPI, Cards, Wallets & More",
      icon: CreditCard,
      popular: true
    },
    {
      id: "cash",
      name: "Cash Payment",
      description: "Pay at the counter (requires admin approval)",
      icon: DollarSign,
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
    console.log('📁 Session files check:', files.map(f => ({
      id: f.id,
      name: f.name,
      hasSessionFile: !!getSessionFile(f.id),
      hasFileProperty: !!f.file
    })));

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

        // If we have a file property but no session file, try to recover
        if (!sessionFile && fileProperty) {
          console.log(`🔄 Attempting to recover file ${f.name} from file property`);
          // This will be handled in the upload loop
          return false; // Don't consider this as missing
        }

        return !sessionFile && !fileProperty;
      });

      if (filesWithoutAnyFile.length > 0) {
        console.error('❌ Missing files detected (no session file or file property):', filesWithoutAnyFile.map(f => f.name));

        toast({
          title: "Files Missing",
          description: "Some files were lost during upload. Please go back and re-upload your files.",
          variant: "destructive",
        });
        setPaymentStatus("failed");
        return;
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
              transactionId: payment?.transactionId || (selectedMethod === 'dev' ? `dev_txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` : `txn_${Date.now()}`),
              amount: payment?.totalCost || calculateTotalCost(),
              paidAt: new Date().toISOString()
            },
            cost: {
              totalCost: payment?.totalCost || calculateTotalCost(),
              baseCost: payment?.breakdown?.baseCost || (calculateTotalCost() * 0.8),
              colorCost: payment?.breakdown?.colorCost || 0,
              paperCost: payment?.breakdown?.paperCost || (calculateTotalCost() * 0.2)
            }
          };

          console.log('📄 Creating print job for:', fileData.name);
          return await createPrintJob(printJobData);
        });

      const createdJobs = await Promise.all(printJobPromises);
      console.log('✅ Successfully created print jobs:', createdJobs.length);

      // Cleanup local files after successful completion
      cleanupLocalFiles();

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

  // Handle Razorpay payment flow - No DB operations before payment
  const handleRazorpayPayment = async (amount: number) => {
    try {
      // Create a temporary order for payment (no print jobs created yet)
      const temporaryOrderData = {
        amount: amount,
        currency: 'INR',
        receipt: `temp_order_${Date.now()}`,
        notes: {
          fileCount: files.length.toString(),
          totalPages: files.reduce((sum, file) => sum + file.pages, 0).toString(),
          printerName: selectedPrinter?.name || 'Unknown'
        }
      };

      // Create Razorpay order directly (without print job dependency)
      const order = await createTemporaryPaymentOrder(temporaryOrderData);

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "PrintHub",
        description: `Print Job Payment - ${files.length} file(s)`,
        order_id: order.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            console.log('💳 Payment successful, verifying...', response);
            setPaymentStatus("processing");

            // Verify payment first
            await verifyTemporaryPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            console.log('✅ Payment verified, now processing files...');
            setPaymentStatus("uploading");

            // Store payment info
            setPaymentInfo({
              method: 'razorpay',
              totalCost: amount,
              transactionId: response.razorpay_payment_id,
              breakdown: {
                baseCost: amount * 0.8,
                colorCost: 0,
                paperCost: amount * 0.2
              }
            });

            // Now upload files to Cloudinary and create print jobs
            await uploadFilesToCloudinary();
            setPaymentStatus("success");
            setIsProcessing(false);

            toast({
              title: "Payment Successful!",
              description: "Your payment has been processed and files are being uploaded.",
            });
          } catch (error) {
            console.error('Post-payment processing failed:', error);
            setPaymentStatus("failed");
            setIsProcessing(false);
            toast({
              title: "Processing Failed",
              description: "Payment was successful but verification failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: "Student",
          email: "student@example.com",
        },
        notes: temporaryOrderData.notes,
        theme: {
          color: "#3b82f6"
        },
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled by user');
            setPaymentStatus("pending");
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You can try again when ready.",
              variant: "destructive",
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      throw error;
    }
  };

  // Create temporary payment order without print job dependency
  const createTemporaryPaymentOrder = async (orderData: {
    amount: number;
    currency: string;
    receipt: string;
    notes: Record<string, string>;
  }) => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error('Authentication token not available');
      }

      const response = await fetch('http://localhost:3001/api/payments/create-temp-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: orderData.amount,
          currency: orderData.currency,
          notes: orderData.notes
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create payment order');
      }

      console.log('💳 Temporary payment order created successfully:', data.data.orderId);
      return data.data;
    } catch (error) {
      console.error('Failed to create temporary payment order:', error);
      throw error;
    }
  };

  // Verify temporary payment without requiring print job ID
  const verifyTemporaryPayment = async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error('Authentication token not available');
      }

      console.log('🔍 Verifying temporary payment:', paymentData.razorpay_payment_id);

      const response = await fetch('http://localhost:3001/api/payments/verify-temp-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Payment verification failed');
      }

      console.log('✅ Temporary payment verified successfully:', data.data);
      return data.data;
    } catch (error) {
      console.error('Failed to verify temporary payment:', error);
      throw error;
    }
  };

  // Handle cash payment flow - Submit request for admin approval
  const handleCashPayment = async (amount: number) => {
    try {
      console.log('💵 Processing cash payment request...');

      if (!selectedPrinter) {
        throw new Error('No printer selected');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // First, upload files to Cloudinary
      setPaymentStatus("uploading");
      const uploadedFiles = [];

      for (const fileData of files) {
        if (fileData.cloudinaryUrl) {
          // File already uploaded
          uploadedFiles.push({
            cloudinaryUrl: fileData.cloudinaryUrl,
            publicId: fileData.cloudinaryPublicId || '',
            originalName: fileData.name,
            format: fileData.format,
            sizeKB: fileData.sizeKB
          });
          continue;
        }

        // Need to upload file
        let sessionFile = getSessionFile(fileData.id);
        if (!sessionFile && fileData.file) {
          sessionFile = fileData.file;
        }

        if (sessionFile) {
          setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }));

          const uploadResult = await uploadFile(sessionFile);

          // Update file with Cloudinary data
          updateFileWithCloudinaryData(
            fileData.id,
            uploadResult.url,
            uploadResult.publicId,
            uploadResult.format,
            uploadResult.sizeKB
          );

          uploadedFiles.push({
            cloudinaryUrl: uploadResult.url,
            publicId: uploadResult.publicId,
            originalName: sessionFile.name,
            format: uploadResult.format || fileData.format,
            sizeKB: uploadResult.sizeKB
          });
        }
      }

      // Create cash payment requests for each file
      setPaymentStatus("processing");

      const cashRequestPromises = files.map(async (fileData) => {
        const uploadedFile = uploadedFiles.find(uf =>
          uf.originalName === fileData.name
        );

        if (!uploadedFile) {
          throw new Error(`File ${fileData.name} was not uploaded`);
        }

        const requestData = {
          printerId: selectedPrinter._id,
          file: uploadedFile,
          settings: settings[fileData.id] || {
            pages: 'all',
            copies: 1,
            color: false,
            duplex: false,
            paperType: 'A4'
          },
          cost: {
            totalCost: amount
          },
          payment: {
            amount: amount,
            status: 'pending',
            method: 'cash'
          }
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/cash-payment/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to create cash payment request');
        }

        return await response.json();
      });

      const cashRequests = await Promise.all(cashRequestPromises);

      console.log('✅ Cash payment requests created:', cashRequests.length);

      // Store payment info
      setPaymentInfo({
        method: 'cash',
        totalCost: amount,
        transactionId: `cash_${cashRequests[0].data.requestId}`,
        breakdown: {
          baseCost: amount * 0.8,
          colorCost: 0,
          paperCost: amount * 0.2
        }
      });

      // Cleanup local files after successful submission
      cleanupLocalFiles();

      setPaymentStatus("success");

      toast({
        title: "Cash Payment Request Submitted",
        description: `Please pay ₹${amount.toFixed(2)} at the counter. Your print job will be processed after admin approval.`,
        duration: 5000,
      });

      // Don't auto-navigate - let user click the button
      setIsProcessing(false);

    } catch (error) {
      console.error('Cash payment error:', error);
      setPaymentStatus("failed");
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      const totalAmount = calculateTotalCost();

      if (selectedMethod === "dev") {
        // Dev Mode: Always succeed immediately
        console.log('🔧 Dev Mode: Payment automatically successful, uploading files...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Short delay for UX

        // Store payment info
        setPaymentInfo({
          method: 'dev',
          totalCost: totalAmount,
          transactionId: `dev_txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          breakdown: {
            baseCost: totalAmount * 0.8,
            colorCost: 0,
            paperCost: totalAmount * 0.2
          }
        });

        await uploadFilesToCloudinary();
        setPaymentStatus("success");
      } else if (selectedMethod === "razorpay") {
        // Online Payment processing via Razorpay (UPI, Cards, Wallets)
        console.log('💳 Processing Razorpay payment...');
        
        if (!window.Razorpay) {
          throw new Error("Razorpay SDK not loaded. Please refresh the page and try again.");
        }

        await handleRazorpayPayment(totalAmount);
      } else if (selectedMethod === "cash") {
        // Cash payment - Create request for admin approval
        console.log('💵 Creating cash payment request...');
        await handleCashPayment(totalAmount);
      }
    } catch (error) {
      setPaymentStatus("failed");
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Processing Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      if (selectedMethod === "dev") {
        setIsProcessing(false);
      }
      // For Razorpay and cash payments, setIsProcessing is handled in their respective callbacks
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
    const isCashPayment = selectedMethod === "cash";

    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className={`w-16 h-16 ${isCashPayment ? 'bg-orange-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto`}>
              {isCashPayment ? (
                <Clock className="w-8 h-8 text-orange-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
            <h1 className={`text-3xl font-bold ${isCashPayment ? 'text-orange-600' : 'text-green-600'}`}>
              {isCashPayment ? 'Request Submitted!' : 'Payment Successful!'}
            </h1>
            <p className="text-muted-foreground">
              {isCashPayment
                ? 'Please pay at the counter. Your print job will be processed after admin approval.'
                : 'Your print job has been submitted to the queue.'}
            </p>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {!isCashPayment && paymentInfo.jobId && (
                    <div className="flex justify-between">
                      <span>Job ID:</span>
                      <span className="font-medium">{paymentInfo.jobId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Amount {isCashPayment ? 'Due' : 'Paid'}:</span>
                    <span className={`font-medium ${isCashPayment ? 'text-orange-600' : 'text-green-600'}`}>
                      ₹{paymentInfo.amount.toFixed(2)}
                    </span>
                  </div>
                  {isCashPayment && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>Status:</span>
                        <Badge variant="outline">Pending Admin Approval</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Button onClick={() => navigate(isCashPayment ? "/student/dashboard" : "/queue")} className="bg-gradient-hero">
              {isCashPayment ? 'Go to Dashboard' : 'Track Your Print Job'}
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
                  <div className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {paymentInfo.breakdown}
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{paymentInfo.amount.toFixed(2)}
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
                        className={`p-4 border rounded-lg transition-all w-full text-left ${selectedMethod === method.id ? selectedClasses : unselectedClasses
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
                          <div className={`w-4 h-4 rounded-full border-2 ${selectedMethod === method.id
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
                  Pay ₹{paymentInfo.amount.toFixed(2)}
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
