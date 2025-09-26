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
    console.log('🔍 uploadFile called with:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      isFileInstance: file instanceof File,
      fileConstructor: file?.constructor?.name
    });

    // Debug the file object in detail
    console.log('🔍 Detailed file object analysis:', {
      file: file,
      prototype: Object.getPrototypeOf(file),
      constructor: file.constructor.name,
      hasArrayBuffer: typeof file.arrayBuffer === 'function',
      hasStream: typeof file.stream === 'function',
      hasText: typeof file.text === 'function',
      ownProperties: Object.getOwnPropertyNames(file),
      fileKeys: Object.keys(file)
    });

    // If it's not a proper File object, try to handle it gracefully
    if (!(file instanceof File)) {
      console.error('❌ Object is not a File instance! Attempting to reconstruct...');
      console.log('🔍 Received object:', file);
      
      // If we have the necessary properties, this might be a deserialized File-like object
      if (file && typeof file === 'object' && 'name' in file && 'size' in file && 'type' in file) {
        console.log('⚠️ File-like object detected, but cannot recreate File from metadata alone');
        throw new Error('File object was corrupted during state management. Please re-upload the file.');
      } else {
        throw new Error('Invalid file object - not a File instance');
      }
    }
    
    setIsUploading(true);
    setProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      // Get authentication token
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required for file upload');
      }

      // Validate file exists
      if (!file) {
        throw new Error('No file provided to upload function');
      }

      // Upload through backend - try alternative FormData approach
      const formData = new FormData();
      
      // Make sure we're appending the actual file object
      console.log('📎 About to append file to FormData:', {
        file: file,
        isFile: file instanceof File,
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      formData.append('file', file, file.name); // Explicitly provide filename
      formData.append('folder', 'uploads'); // Optional folder parameter

      console.log('📤 Starting backend upload for file:', file.name);
      console.log('🔍 Upload details:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        apiUrl: `${import.meta.env.VITE_API_BASE_URL}/upload/file`,
        hasToken: !!token,
        formDataHasFile: formData.has('file')
      });

      // Log FormData contents (for debugging)
      console.log('📋 FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
      }

      // Additional FormData debugging
      console.log('🔍 FormData debug info:', {
        hasFileEntry: formData.has('file'),
        hasFolderEntry: formData.has('folder'),
        formDataKeys: Array.from(formData.keys()),
        fileIsValid: file instanceof File,
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type,
        fileLastModified: file.lastModified
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/upload/file`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type manually - let axios set it with the boundary
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
      
      // Log detailed error information for debugging
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Response headers:', error.response?.headers);
        console.error('Request config:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: 'FormData (cannot log)'
        });
        
        // Try to extract specific error details
        const errorData = error.response?.data;
        if (errorData) {
          console.error('🔍 Detailed error analysis:', {
            success: errorData.success,
            errorMessage: errorData.error?.message,
            errorCode: errorData.error?.code,
            errorDetails: errorData.error?.details,
            fullErrorObject: errorData.error
          });
        }
      }
      
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
