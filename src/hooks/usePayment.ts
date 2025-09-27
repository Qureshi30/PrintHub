import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

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
            const response = await fetch('http://localhost:3001/api/payments/create-order', {
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

            const data = await response.json();

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
            const response = await fetch('http://localhost:3001/api/payments/verify-payment', {
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
            const response = await fetch(`http://localhost:3001/api/payments/${printJobId}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

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