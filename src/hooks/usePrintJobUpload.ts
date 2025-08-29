import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface PrintJobSettings {
  copies?: number;
  color?: boolean;
  duplex?: boolean;
  paperType?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Certificate';
  pages?: string;
}

interface CreatePrintJobRequest {
  file: File;
  printerId: string;
  settings?: PrintJobSettings;
  notes?: string;
}

interface PrintJobResponse {
  printJob: {
    _id: string;
    clerkUserId: string;
    printerId: string;
    file: {
      cloudinaryUrl: string;
      publicId: string;
      originalName: string;
      format: string;
      sizeKB: number;
    };
    settings: PrintJobSettings;
    status: string;
    queuePosition: number;
    estimatedCompletionTime: string;
    pricing: {
      costPerPage: number;
      colorSurcharge: number;
      paperTypeSurcharge: number;
      totalCost: number;
      currency: string;
    };
    payment: {
      status: string;
      method: string;
    };
    timing: {
      submittedAt: string;
      misprint: boolean;
      reprintCount: number;
    };
  };
  upload: {
    publicId: string;
    url: string;
    format: string;
    sizeKB: number;
  };
  queuePosition: number;
  estimatedCompletionTime: string;
}

export const usePrintJobUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const buildFormData = (request: CreatePrintJobRequest): FormData => {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('printerId', request.printerId);

    if (request.settings) {
      const { settings } = request;
      if (settings.copies !== undefined) {
        formData.append('settings.copies', settings.copies.toString());
      }
      if (settings.color !== undefined) {
        formData.append('settings.color', settings.color.toString());
      }
      if (settings.duplex !== undefined) {
        formData.append('settings.duplex', settings.duplex.toString());
      }
      if (settings.paperType) {
        formData.append('settings.paperType', settings.paperType);
      }
      if (settings.pages) {
        formData.append('settings.pages', settings.pages);
      }
    }

    if (request.notes) {
      formData.append('notes', request.notes);
    }

    return formData;
  };

  const createPrintJob = useCallback(async (request: CreatePrintJobRequest): Promise<PrintJobResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const formData = buildFormData(request);

      const response = await fetch(`${API_BASE_URL}/upload/print-job`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create print job';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  return {
    createPrintJob,
    isLoading,
    error,
  };
};
