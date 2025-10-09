import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '@/lib/apiClient';

export interface PaymentStatus {
    printJobId: string;
    paymentStatus: 'pending' | 'completed' | 'failed';
    jobStatus: string;
    amount: number;
    paidAt?: string;
}

export interface CreateOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    key: string;
    printJobId: string;
}

export const usePayment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();

    const createPaymentOrder = useCallback(async (printJobId: string, amount: number): Promise<CreateOrderResponse> => {
        setLoading(true);
        setError(null);

        try {
            const token = await getToken();

            if (!token) {
                throw new Error('Authentication token not available');
            }

            const response = await apiClient.post('/payments/create-order', {
                printJobId,
                amount
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = response.data;

            if (!data.success) {
                throw new Error(data.error?.message || 'Failed to create payment order');
            }

            console.log('💳 Payment order created successfully:', data.data.orderId);
            return data.data;
        } catch (err: any) {
            let errorMessage = 'Failed to create payment order';

            if (err.response?.data?.error?.message) {
                errorMessage = err.response.data.error.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            console.error('❌ Create payment order error:', errorMessage);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    const verifyPayment = useCallback(async (paymentData: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        printJobId: string;
    }) => {
        setLoading(true);
        setError(null);

        try {
            const token = await getToken();

            if (!token) {
                throw new Error('Authentication token not available');
            }

            console.log('🔍 Verifying payment:', paymentData.razorpay_payment_id);

            const response = await apiClient.post('/payments/verify-payment', paymentData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = response.data;

            if (!data.success) {
                throw new Error(data.error?.message || 'Payment verification failed');
            }

            console.log('✅ Payment verified successfully:', data.data);
            return data.data;
        } catch (err: any) {
            let errorMessage = 'Payment verification failed';

            if (err.response?.data?.error?.message) {
                errorMessage = err.response.data.error.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            console.error('❌ Payment verification error:', errorMessage);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    const getPaymentStatus = useCallback(async (printJobId: string): Promise<PaymentStatus> => {
        setLoading(true);
        setError(null);

        try {
            const token = await getToken();
            const response = await apiClient.get(`/payments/${printJobId}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = response.data;

            if (!data.success) {
                throw new Error(data.error?.message || 'Failed to get payment status');
            }

            return data.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get payment status';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    return {
        loading,
        error,
        createPaymentOrder,
        verifyPayment,
        getPaymentStatus
    };
};