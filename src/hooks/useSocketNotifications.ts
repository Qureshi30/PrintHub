import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { socketService } from '@/services/socketService';
import { useBrowserNotifications } from './useBrowserNotifications';
import { useToast } from './use-toast';

export function useSocketNotifications() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const {
    showPrintJobCompleted,
    showPrintJobFailed,
    showPrintJobTerminated,
    showCashPaymentApproved
  } = useBrowserNotifications();
  
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!userId) {
      console.log('⏳ Socket notifications: Waiting for userId...');
      return;
    }
    
    if (isInitialized.current) {
      console.log('✅ Socket notifications: Already initialized for user', userId);
      return;
    }

    console.log('🚀 Socket notifications: Initializing for user', userId);

    // Connect to Socket.IO server
    const socket = socketService.connect(userId);
    isInitialized.current = true;
    
    console.log('📡 Socket notifications: Event listeners registered');

    // Listen for print job completed events
    const handlePrintJobCompleted = (data: any) => {
      console.log('🎉 SOCKET EVENT: Print job completed:', data);
      
      // Show browser notification
      showPrintJobCompleted({
        jobId: data.jobId,
        fileName: data.fileName,
        printerName: data.printerName,
        completedAt: data.completedAt
      });

      // Show toast notification in UI
      toast({
        title: '✅ Print Job Completed',
        description: `Your print job "${data.fileName}" is ready for pickup.`,
        duration: 5000,
      });
    };

    // Listen for print job failed events
    const handlePrintJobFailed = (data: any) => {
      console.log('❌ SOCKET EVENT: Print job failed:', data);
      
      // Show browser notification
      showPrintJobFailed({
        jobId: data.jobId,
        fileName: data.fileName,
        printerName: data.printerName,
        error: data.error || 'Unknown error'
      });

      // Show toast notification in UI
      toast({
        title: '❌ Print Job Failed',
        description: `Your print job "${data.fileName}" failed: ${data.error}`,
        variant: 'destructive',
        duration: 7000,
      });
    };

    // Listen for print job terminated events
    const handlePrintJobTerminated = (data: any) => {
      console.log('🛑 SOCKET EVENT: Print job terminated:', data);
      
      // Show browser notification
      showPrintJobTerminated({
        jobId: data.jobId,
        fileName: data.fileName,
        printerName: data.printerName
      });

      // Show toast notification in UI
      toast({
        title: '🛑 Print Job Terminated',
        description: `Your print job "${data.fileName}" was terminated.`,
        variant: 'destructive',
        duration: 5000,
      });
    };

    // Listen for cash payment approved events
    const handleCashPaymentApproved = (data: any) => {
      console.log('💰 SOCKET EVENT: Cash payment approved:', data);
      
      // Show browser notification
      showCashPaymentApproved({
        requestId: data.requestId,
        amount: data.amount,
        jobId: data.jobId
      });

      // Show toast notification in UI
      toast({
        title: '💰 Payment Approved',
        description: `Your cash payment of ₹${data.amount} has been approved.`,
        duration: 5000,
      });
    };

    // Register event listeners
    socket.on('print-job-completed', handlePrintJobCompleted);
    socket.on('print-job-failed', handlePrintJobFailed);
    socket.on('print-job-terminated', handlePrintJobTerminated);
    socket.on('cash-payment-approved', handleCashPaymentApproved);

    // Cleanup on unmount
    return () => {
      socket.off('print-job-completed', handlePrintJobCompleted);
      socket.off('print-job-failed', handlePrintJobFailed);
      socket.off('print-job-terminated', handlePrintJobTerminated);
      socket.off('cash-payment-approved', handleCashPaymentApproved);
      isInitialized.current = false;
    };
  }, [userId, toast, showPrintJobCompleted, showPrintJobFailed, showPrintJobTerminated, showCashPaymentApproved]);

  return {
    isConnected: socketService.isConnected()
  };
}
