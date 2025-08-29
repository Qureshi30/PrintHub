// Shared upload-related types
export type UploadedItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // Cloudinary secure URL for download/preview
  isImage: boolean;
  createdAt: number; // timestamp
  cloudinaryPublicId?: string; // Cloudinary public ID for management
};
