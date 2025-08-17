// Shared upload-related types
export type UploadedItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string; // object URL for download/preview
  isImage: boolean;
  createdAt: number; // timestamp
};
