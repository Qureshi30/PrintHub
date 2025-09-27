import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentProps {
    printJobId: string;
    amount: number;
    description: string;
    onSuccess?: (paymentId: string) => void;
    onError?: (error: string) => void;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export const PaymentComponent: React.FC<PaymentProps> = ({
    printJobId,
    amount,
    description,
    onSuccess,
    onError
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();
    const { toast } = useToast();

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
        try {
            setIsProcessing(true);
            setError(null);

            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Razorpay SDK failed to load');
            }

            // Get authentication token
            const token = await getToken();

            // Create order
            const orderResponse = await fetch('http://localhost:3001/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    printJobId,
                    amount
                })
            });

            const orderData = await orderResponse.json();

            if (!orderData.success) {
                throw new Error(orderData.error?.message || 'Failed to create payment order');
            }

            // Razorpay options
            const options = {
                key: orderData.data.key,
                amount: orderData.data.amount,
                currency: orderData.data.currency,
                name: 'PrintHub',
                description: description,
                order_id: orderData.data.orderId,
                handler: async function (response: any) {
                    try {
                        // Verify payment
                        const verifyResponse = await fetch('http://localhost:3001/api/payments/verify-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                printJobId: printJobId
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            toast({
                                title: 'Payment Successful!',
                                description: 'Your print job has been paid for successfully.'
                            });
                            onSuccess?.(response.razorpay_payment_id);
                        } else {
                            throw new Error(verifyData.error?.message || 'Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
                        setError(errorMessage);
                        toast({
                            title: 'Payment Verification Failed',
                            description: errorMessage,
                            variant: 'destructive'
                        });
                        onError?.(errorMessage);
                    }
                },
                prefill: {
                    name: 'PrintHub User',
                    email: 'user@printhub.com',
                    contact: '9999999999'
                },
                theme: {
                    color: '#3B82F6'
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        toast({
                            title: 'Payment Cancelled',
                            description: 'Payment was cancelled by user.',
                            variant: 'destructive'
                        });
                    }
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error('Payment error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Payment failed';
            setError(errorMessage);
            toast({
                title: 'Payment Failed',
                description: errorMessage,
                variant: 'destructive'
            });
            onError?.(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Details
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <div className="text-2xl font-bold">₹{amount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Amount to be paid</div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay ₹{amount.toFixed(2)}
                        </>
                    )}
                </Button>

                <div className="text-xs text-center text-muted-foreground">
                    Secured by Razorpay • Your payment information is encrypted
                </div>
            </CardContent>
        </Card>
    );
};

export default PaymentComponent;