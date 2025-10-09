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

            return data.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create payment order';
            setError(errorMessage);
            throw err;
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
            const response = await apiClient.post('/payments/verify-payment', paymentData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = response.data;

            if (!data.success) {
                throw new Error(data.error?.message || 'Payment verification failed');
            }

            return data.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Payment verification failed';
            setError(errorMessage);
            throw err;
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