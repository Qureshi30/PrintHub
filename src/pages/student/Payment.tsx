import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Smartphone,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Loader2
} from "lucide-react";

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Declare Razorpay global
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [selectedMethod, setSelectedMethod] = useState<string>("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "failed">("pending");
  const [paymentInfo, setPaymentInfo] = useState({
    amount: 0,
    jobId: "",
    fileName: "",
    breakdown: "",
    printJobId: ""
  });

  // Get payment details from URL params
  useEffect(() => {
    const amount = parseFloat(searchParams.get('amount') || '0');
    const jobId = searchParams.get('jobId') || '';
    const fileName = searchParams.get('fileName') || '';
    const printJobId = searchParams.get('printJobId') || '';
    const pages = searchParams.get('pages') || '1';
    const copies = searchParams.get('copies') || '1';

    setPaymentInfo({
      amount,
      jobId,
      fileName,
      printJobId,
      breakdown: `${pages} pages × ${copies} copies × ₹${(amount / (parseInt(pages) * parseInt(copies))).toFixed(2)} = ₹${amount.toFixed(2)}`
    });
  }, [searchParams]);

  const paymentMethods = [
    {
      id: "razorpay",
      name: "Razorpay Payment",
      description: "UPI, Cards, Net Banking, Wallets",
      icon: CreditCard,
      popular: true
    }
  ];

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay");
      }

      // Create order on backend
      const orderResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id || ''}`,
        },
        body: JSON.stringify({
          amount: paymentInfo.amount,
          printJobId: paymentInfo.printJobId,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "PrintHub",
        description: `Payment for ${paymentInfo.fileName}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user?.id || ''}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                printJobId: paymentInfo.printJobId,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            setPaymentStatus("success");
            toast.success("Payment successful!");
          } catch (error) {
            console.error('Payment verification failed:', error);
            setPaymentStatus("failed");
            toast.error("Payment verification failed. Please contact support.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.emailAddresses?.[0]?.emailAddress || '',
        },
        theme: {
          color: "#3B82F6"
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setPaymentStatus("pending");
            toast.error("Payment cancelled");
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus("failed");
      toast.error("Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const retryPayment = () => {
    setPaymentStatus("pending");
    setIsProcessing(false);
  };

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
                        className={`p-4 border rounded-lg cursor-pointer transition-all w-full text-left ${selectedMethod === method.id
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
                          <div className={`w-4 h-4 rounded-full border-2 ${selectedMethod === method.id
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
