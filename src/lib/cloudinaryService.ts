import { UploadResponse } from '@/types/database';

// Cloudinary configuration from environment variables
const CLOUDINARY_CONFIG = {
  CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY,
  FOLDER: 'printhub-files' // Default folder for uploads
};

export class CloudinaryService {
  private static instance: CloudinaryService;
  
  private constructor() {}

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadFile(file: File, options?: {
    folder?: string;
    public_id?: string;
    resource_type?: 'auto' | 'image' | 'video' | 'raw';
  }): Promise<UploadResponse> {
    if (!CLOUDINARY_CONFIG.CLOUD_NAME || !CLOUDINARY_CONFIG.UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration missing. Please check environment variables.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
    formData.append('folder', options?.folder || CLOUDINARY_CONFIG.FOLDER);
    
    if (options?.public_id) {
      formData.append('public_id', options.public_id);
    }

    if (options?.resource_type) {
      formData.append('resource_type', options.resource_type);
    }

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/${options?.resource_type || 'auto'}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result as UploadResponse;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  /**
   * Upload print job file with specific naming and folder structure
   */
  async uploadPrintJobFile(file: File, jobId: string, clerkUserId: string): Promise<UploadResponse> {
    const publicId = `${CLOUDINARY_CONFIG.FOLDER}/${clerkUserId}/${jobId}`;
    
    return this.uploadFile(file, {
      folder: CLOUDINARY_CONFIG.FOLDER,
      public_id: publicId,
      resource_type: 'raw' // For documents (PDF, DOC, etc.)
    });
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'raw'): Promise<boolean> {
    if (!CLOUDINARY_CONFIG.CLOUD_NAME || !CLOUDINARY_CONFIG.API_KEY) {
      throw new Error('Cloudinary configuration missing for delete operation');
    }

    try {
      // Note: For security reasons, delete operations should typically be done from the backend
      // This is a placeholder for frontend integration
      console.warn('Delete operation should be performed from backend for security');
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Generate optimized URL for file preview
   */
  generatePreviewUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  }): string {
    if (!CLOUDINARY_CONFIG.CLOUD_NAME) {
      throw new Error('Cloudinary cloud name not configured');
    }

    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.CLOUD_NAME}`;
    let transformations = '';

    if (options) {
      const transforms = [];
      if (options.width) transforms.push(`w_${options.width}`);
      if (options.height) transforms.push(`h_${options.height}`);
      if (options.quality) transforms.push(`q_${options.quality}`);
      if (options.format) transforms.push(`f_${options.format}`);
      
      if (transforms.length > 0) {
        transformations = `/${transforms.join(',')}`;
      }
    }

    return `${baseUrl}/image/upload${transformations}/${publicId}`;
  }

  /**
   * Check if file type is supported for print jobs
   */
  isFileTypeSupported(file: File): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    return supportedTypes.includes(file.type);
  }

  /**
   * Validate file size (max 10MB for print jobs)
   */
  isFileSizeValid(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Get file size in KB for database storage
   */
  getFileSizeInKB(file: File): number {
    return Math.round(file.size / 1024);
  }
}

// Export singleton instance
export const cloudinaryService = CloudinaryService.getInstance();
