import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

export interface BackendUploadResponse {
  success: boolean;
  data: {
    publicId: string;
    url: string;
    format: string;
    sizeKB: number;
    originalName: string;
    uploadedAt: string;
  };
  message: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseBackendUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: BackendUploadResponse['data']) => void;
  onError?: (error: Error) => void;
}

export const useBackendUpload = (options: UseBackendUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const { getToken } = useAuth();

  const uploadFile = useCallback(async (file: File): Promise<BackendUploadResponse['data']> => {
    setIsUploading(true);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      // Get authentication token
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required for file upload');
      }

      // Upload through backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'uploads'); // Optional folder parameter

      console.log('📤 Starting backend upload for file:', file.name);

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload/file`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const progressData = {
                loaded: progressEvent.loaded,
                total: progressEvent.total,
                percentage,
              };
              setProgress(progressData);
              options.onProgress?.(progressData);
            }
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Upload failed');
      }

      const result = response.data.data;
      console.log('✅ Backend upload successful:', result);
      
      setIsUploading(false);
      options.onSuccess?.(result);
      
      return result;
    } catch (error) {
      console.error('❌ Backend upload failed:', error);
      setIsUploading(false);
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      options.onError?.(uploadError);
      throw uploadError;
    }
  }, [options, getToken]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<BackendUploadResponse['data'][]> => {
    const results: BackendUploadResponse['data'][] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadFile(files[i]);
        results.push(result);
      } catch (error) {
        console.error(`Failed to upload file ${i + 1}:`, error);
        throw error;
      }
    }
    
    return results;
  }, [uploadFile]);

  return {
    uploadFile,
    uploadMultiple,
    isUploading,
    progress,
  };
};
