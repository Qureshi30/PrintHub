import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  resource_type: string;
  created_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseCloudinarySignedUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: CloudinaryUploadResponse) => void;
  onError?: (error: Error) => void;
}

export const useCloudinarySignedUpload = (options: UseCloudinarySignedUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const { getToken } = useAuth();

  const uploadFile = useCallback(async (file: File): Promise<CloudinaryUploadResponse> => {
    setIsUploading(true);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      // Get authentication token
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required for file upload');
      }

      // Step 1: Get signed upload parameters from backend
      console.log('🔐 Getting signed upload parameters...');
      const signatureResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload/cloudinary-signature`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!signatureResponse.data.success) {
        throw new Error(signatureResponse.data.error?.message || 'Failed to get upload signature');
      }

      const signedParams = signatureResponse.data.data;
      console.log('📝 Signed parameters received:', signedParams);

      // Step 2: Upload file to Cloudinary using signed parameters
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signedParams.api_key);
      formData.append('timestamp', signedParams.timestamp.toString());
      formData.append('signature', signedParams.signature);
      
      // Add all other parameters that were signed
      if (signedParams.folder) {
        formData.append('folder', signedParams.folder);
      }
      if (signedParams.resource_type) {
        formData.append('resource_type', signedParams.resource_type);
      }
      if (signedParams.use_filename !== undefined) {
        formData.append('use_filename', signedParams.use_filename.toString());
      }
      if (signedParams.unique_filename !== undefined) {
        formData.append('unique_filename', signedParams.unique_filename.toString());
      }

      console.log('📤 Starting signed upload to Cloudinary with params:', {
        api_key: signedParams.api_key,
        timestamp: signedParams.timestamp,
        folder: signedParams.folder,
        signature: signedParams.signature.substring(0, 10) + '...' // Only show first 10 chars for security
      });

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${signedParams.cloud_name}/auto/upload`,
        formData,
        {
          headers: {
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

      const result: CloudinaryUploadResponse = uploadResponse.data;
      console.log('✅ Signed upload successful:', result);
      
      setIsUploading(false);
      options.onSuccess?.(result);
      
      return result;
    } catch (error) {
      console.error('❌ Signed upload failed:', error);
      setIsUploading(false);
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      options.onError?.(uploadError);
      throw uploadError;
    }
  }, [options, getToken]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<CloudinaryUploadResponse[]> => {
    const results: CloudinaryUploadResponse[] = [];
    
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
