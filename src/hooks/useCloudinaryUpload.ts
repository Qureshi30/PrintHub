import { useState, useCallback } from 'react';
import axios from 'axios';

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

export interface UseCloudinaryUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: CloudinaryUploadResponse) => void;
  onError?: (error: Error) => void;
}

export const useCloudinaryUpload = (options: UseCloudinaryUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });

  const uploadFile = useCallback(async (file: File): Promise<CloudinaryUploadResponse> => {
    setIsUploading(true);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      // Check if environment variables are available
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      
      console.log('🌤️ Cloudinary Config:', { cloudName, uploadPreset });
      
      if (!cloudName) {
        throw new Error('VITE_CLOUDINARY_CLOUD_NAME not found in environment variables.');
      }

      // If no upload preset, throw helpful error
      if (!uploadPreset) {
        throw new Error('Upload preset not configured. Please create an unsigned upload preset named "printhub_uploads" in your Cloudinary dashboard, or use the signed upload method.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'print_jobs');

      console.log('📤 Starting unsigned upload with preset to:', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
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

      const result: CloudinaryUploadResponse = response.data;
      
      console.log('✅ Upload successful:', result);
      
      setIsUploading(false);
      options.onSuccess?.(result);
      
      return result;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      setIsUploading(false);
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      options.onError?.(uploadError);
      throw uploadError;
    }
  }, [options]);

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
