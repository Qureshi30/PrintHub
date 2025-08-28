import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface PrintJobData {
  selectedFiles?: Array<{
    id: string;
    name: string;
    pages: number;
    size: string;
    type: string;
  }>;
  settings?: {
    [fileId: string]: {
      pageRange: string;
      colorMode: 'color' | 'blackwhite';
      duplex: 'single' | 'double';
      copies: number;
      paperSize: string;
      paperType: string;
    };
  };
  printer?: {
    id: string;
    name: string;
    location: string;
    queueLength: number;
    estimatedWait: number;
  };
  schedule?: {
    isScheduled: boolean;
    timeSlot?: string;
  };
  cost?: {
    total: number;
    breakdown: string;
  };
}

interface PrintJobContextType {
  jobData: PrintJobData;
  updateJobData: (data: Partial<PrintJobData>) => void;
  clearJobData: () => void;
  isJobComplete: () => boolean;
}

const PrintJobContext = createContext<PrintJobContextType | undefined>(undefined);

export function PrintJobProvider({ children }: { readonly children: ReactNode }) {
  const [jobData, setJobData] = useState<PrintJobData>({});

  const updateJobData = (data: Partial<PrintJobData>) => {
    setJobData(prev => ({ ...prev, ...data }));
  };

  const clearJobData = () => {
    setJobData({});
  };

  const isJobComplete = () => {
    return !!(jobData.selectedFiles && jobData.selectedFiles.length > 0 && jobData.settings && jobData.printer);
  };

  const contextValue = useMemo(() => ({
    jobData,
    updateJobData,
    clearJobData,
    isJobComplete
  }), [jobData]);

  return (
    <PrintJobContext.Provider value={contextValue}>
      {children}
    </PrintJobContext.Provider>
  );
}

export function usePrintJob() {
  const context = useContext(PrintJobContext);
  if (context === undefined) {
    throw new Error('usePrintJob must be used within a PrintJobProvider');
  }
  return context;
}
