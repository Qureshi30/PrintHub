import { createContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { parseDocumentPages } from '@/utils/documentParser';

// Print Job Step Types
export type PrintJobStep = 'upload' | 'settings' | 'printer' | 'confirm' | 'payment' | 'queue';

// File with optional Cloudinary data (supports local files during flow)
export interface PrintJobFile {
  id: string;
  name: string;
  size: number;
  type: string;
  pages: number;
  isImage: boolean;
  format: string;
  sizeKB: number;

  // Local file data (present during upload -> payment flow)
  file?: File;

  // Cloudinary data (present after successful upload)
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}

// Print settings for each file
export interface PrintJobSettings {
  pages: string;
  copies: number;
  color: boolean;
  duplex: boolean;
  paperType: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Certificate';
}

// Selected printer
export interface SelectedPrinter {
  _id: string;
  name: string;
  location: string;
  status: string;
  queueLength: number;
  estimatedWait: number;
}

// Payment information
export interface PaymentInfo {
  method: 'razorpay' | 'cash' | 'dev' | 'student_credit' | 'campus_card';
  totalCost: number;
  transactionId?: string;
  breakdown: {
    baseCost: number;
    colorCost: number;
    paperCost: number;
  };
}

// Complete print job context data
export interface PrintJobContextData {
  // Current step
  currentStep: PrintJobStep;

  // Files and settings
  files: PrintJobFile[];
  settings: { [fileId: string]: PrintJobSettings };

  // Printer selection
  selectedPrinter: SelectedPrinter | null;

  // Payment information
  payment: PaymentInfo | null;

  // Job creation status
  isCreatingJobs: boolean;
  createdJobIds: string[];

  // Navigation
  canProceed: boolean;
}

export interface PrintJobContextActions {
  // Step navigation
  setCurrentStep: (step: PrintJobStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;

  // File management
  addFile: (file: PrintJobFile) => void;
  addLocalFile: (localFile: File) => Promise<void>;
  removeFile: (fileId: string) => void;
  updateFileSettings: (fileId: string, settings: Partial<PrintJobSettings>) => void;

  // Cloudinary upload (after payment)
  uploadFilesToCloudinary: () => Promise<void>;
  updateFileWithCloudinaryData: (fileId: string, cloudinaryUrl: string, cloudinaryPublicId: string, format?: string, sizeKB?: number) => void;

  // Session file access (not persisted)
  getSessionFile: (fileId: string) => File | undefined;

  // Printer selection
  selectPrinter: (printer: SelectedPrinter) => void;

  // Payment
  setPaymentInfo: (payment: PaymentInfo) => void;

  // Job creation
  setIsCreatingJobs: (creating: boolean) => void;
  addCreatedJobId: (jobId: string) => void;

  // File cleanup
  cleanupLocalFiles: () => void;

  // Reset
  resetFlow: () => void;
}

export interface PrintJobContextType extends PrintJobContextData, PrintJobContextActions { }

export const PrintJobContext = createContext<PrintJobContextType | undefined>(undefined);

const STEP_ORDER: PrintJobStep[] = ['upload', 'settings', 'printer', 'confirm', 'payment', 'queue'];

const DEFAULT_SETTINGS: PrintJobSettings = {
  pages: 'all',
  copies: 1,
  color: false,
  duplex: false,
  paperType: 'A4',
};

const STORAGE_KEY = 'printJobFlow';

// Load state from localStorage and restore files from base64
const loadStoredState = (): {
  currentStep: PrintJobStep;
  files: PrintJobFile[];
  settings: { [fileId: string]: PrintJobSettings };
  selectedPrinter: SelectedPrinter | null;
  payment: PaymentInfo | null;
  restoredSessionFiles: { [fileId: string]: File };
} => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      console.log('🔄 CONTEXT LOAD: Loading state from localStorage');
      const parsed = JSON.parse(stored);
      console.log('📋 CONTEXT LOAD: Parsed data:', {
        currentStep: parsed.currentStep,
        filesCount: parsed.files?.length || 0,
        hasSettings: !!parsed.settings,
        hasSelectedPrinter: !!parsed.selectedPrinter
      });

      // Restore files from base64
      const restoredSessionFiles: { [fileId: string]: File } = {};
      const restoredFiles = (parsed.files || []).map((file: PrintJobFile & { base64Data?: { base64: string; name: string; type: string; size: number } }) => {
        console.log('📄 CONTEXT LOAD: Processing file:', file.name, {
          hasBase64Data: !!file.base64Data,
          hasFileProperty: !!file.file,
          base64DataSize: file.base64Data?.size
        });

        if (file.base64Data) {
          try {
            console.log('🔄 CONTEXT LOAD: Restoring file from base64:', file.name);
            // Convert base64 back to File
            const binaryString = atob(file.base64Data.base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const restoredFile = new File([bytes], file.base64Data.name, {
              type: file.base64Data.type
            });

            // Store in both session files and file property
            restoredSessionFiles[file.id] = restoredFile;

            console.log('✅ CONTEXT LOAD: File restored successfully:', file.name, {
              restoredFileSize: restoredFile.size,
              restoredFileType: restoredFile.type
            });

            return {
              ...file,
              file: restoredFile, // Restore file property
              base64Data: undefined // Remove base64 after restoration
            };
          } catch (error) {
            console.warn(`❌ CONTEXT LOAD: Failed to restore file ${file.name} from base64:`, error);
          }
        } else {
          console.log('⚠️ CONTEXT LOAD: No base64 data for file:', file.name);
        }
        return file;
      });

      console.log('📁 CONTEXT LOAD: Restoration complete:', {
        totalFiles: restoredFiles.length,
        restoredSessionFiles: Object.keys(restoredSessionFiles).length,
        filesWithFileProperty: restoredFiles.filter(f => !!f.file).length
      });

      return {
        currentStep: parsed.currentStep || 'upload',
        files: restoredFiles,
        settings: parsed.settings || {},
        selectedPrinter: parsed.selectedPrinter || null,
        payment: parsed.payment || null,
        restoredSessionFiles
      };
    }
  } catch (error) {
    console.warn('❌ CONTEXT LOAD: Failed to load print job state from localStorage:', error);
  }

  console.log('📭 CONTEXT LOAD: No stored state found, using defaults');
  return {
    currentStep: 'upload' as PrintJobStep,
    files: [],
    settings: {},
    selectedPrinter: null,
    payment: null,
    restoredSessionFiles: {}
  };
};

// Save state to localStorage with files as base64
const saveStateToStorage = async (state: {
  currentStep: PrintJobStep;
  files: PrintJobFile[];
  settings: { [fileId: string]: PrintJobSettings };
  selectedPrinter: SelectedPrinter | null;
  payment: PaymentInfo | null;
}, sessionFiles: { [fileId: string]: File }) => {
  try {
    // Convert files to base64 for storage
    const filesWithBase64 = await Promise.all(
      state.files.map(async (file) => {
        const actualFile = sessionFiles[file.id] || file.file;
        let base64Data = null;

        console.log(`📦 CONTEXT SAVE: Processing file ${file.name}`, {
          hasSessionFile: !!sessionFiles[file.id],
          hasFileProperty: !!file.file,
          actualFileFound: !!actualFile,
          sessionFileSize: sessionFiles[file.id]?.size,
          filePropertySize: file.file?.size
        });

        if (actualFile) {
          try {
            const arrayBuffer = await actualFile.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            base64Data = {
              base64,
              name: actualFile.name,
              type: actualFile.type,
              size: actualFile.size
            };
            console.log(`✅ CONTEXT SAVE: Successfully converted ${file.name} to base64 (${base64Data.size} bytes)`);
          } catch (error) {
            console.warn(`❌ CONTEXT SAVE: Failed to convert ${file.name} to base64:`, error);
          }
        } else {
          console.warn(`⚠️ CONTEXT SAVE: No file data found for ${file.name}`);
        }

        return {
          ...file,
          file: undefined, // Remove File object
          base64Data // Store base64 representation
        };
      })
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentStep: state.currentStep,
      files: filesWithBase64,
      settings: state.settings,
      selectedPrinter: state.selectedPrinter,
      payment: state.payment,
    }));
  } catch (error) {
    console.warn('Failed to save print job state to localStorage:', error);
  }
};

export function PrintJobProvider({ children }: { readonly children: ReactNode }) {
  const storedState = loadStoredState();

  const [currentStep, setCurrentStep] = useState<PrintJobStep>(storedState.currentStep);
  const [files, setFiles] = useState<PrintJobFile[]>(storedState.files);
  const [settings, setSettings] = useState<{ [fileId: string]: PrintJobSettings }>(storedState.settings);
  const [selectedPrinter, setSelectedPrinter] = useState<SelectedPrinter | null>(storedState.selectedPrinter);
  const [payment, setPayment] = useState<PaymentInfo | null>(storedState.payment);
  const [isCreatingJobs, setIsCreatingJobs] = useState(false);
  const [createdJobIds, setCreatedJobIds] = useState<string[]>([]);

  // Initialize session files with restored files from localStorage
  const [sessionFiles, setSessionFiles] = useState<{ [fileId: string]: File }>(storedState.restoredSessionFiles);
  const [isCleanedUp, setIsCleanedUp] = useState(false);

  // Save to localStorage whenever state changes (but not if files have been cleaned up)
  useEffect(() => {
    console.log('💾 CONTEXT: Saving state to localStorage, files count:', files.length);
    files.forEach((file, index) => {
      console.log(`📄 CONTEXT SAVE: File ${index + 1}: ${file.name}`, {
        hasFileProperty: !!file.file,
        fileSize: file.file?.size
      });
    });

    // If cleanup has been done, don't save file/base64 data
    if (isCleanedUp) {
      console.log('⚠️ CONTEXT SAVE: Files cleaned up, saving without file data');
      const cleanedFiles = files.map(f => ({
        ...f,
        file: undefined,
        base64Data: undefined
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentStep,
        files: cleanedFiles,
        settings,
        selectedPrinter,
        payment,
      }));
    } else {
      saveStateToStorage({
        currentStep,
        files,
        settings,
        selectedPrinter,
        payment,
      }, sessionFiles);
    }
  }, [currentStep, files, settings, selectedPrinter, payment, sessionFiles, isCleanedUp]);

  // Calculate if we can proceed to the next step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'upload':
        return files.length > 0;
      case 'settings':
        return files.every(file => settings[file.id]);
      case 'printer':
        return selectedPrinter !== null;
      case 'confirm':
        return true; // Always can proceed from confirm
      case 'payment':
        return payment !== null;
      case 'queue':
        return false; // Final step
      default:
        return false;
    }
  }, [currentStep, files, settings, selectedPrinter, payment]);

  // Step navigation with useCallback for stable references
  const goToNextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1 && canProceed) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [currentStep, canProceed]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [currentStep]);

  // File management
  const addFile = (file: PrintJobFile) => {
    setFiles(prev => [...prev, file]);
    // Set default settings for the new file
    setSettings(prev => ({
      ...prev,
      [file.id]: DEFAULT_SETTINGS,
    }));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[fileId];
      return newSettings;
    });
  };

  const updateFileSettings = (fileId: string, newSettings: Partial<PrintJobSettings>) => {
    setSettings(prev => ({
      ...prev,
      [fileId]: { ...prev[fileId], ...newSettings },
    }));
  };

  // Payment calculation (unused but keep for future)
  const _calculateTotalCost = (): PaymentInfo | null => {
    if (!selectedPrinter || files.length === 0) return null;

    let totalBaseCost = 0;
    let totalColorCost = 0;
    let totalPaperCost = 0;

    files.forEach(file => {
      const fileSettings = settings[file.id];
      if (!fileSettings) return;

      const baseCostPerPage = 0.10;
      const paperMultiplier = fileSettings.paperType === 'A3' ? 2 : 1;

      const pages = file.pages;
      const copies = fileSettings.copies;
      const totalPages = pages * copies;

      totalBaseCost += baseCostPerPage * totalPages;
      totalColorCost += fileSettings.color ? (baseCostPerPage * 2 * totalPages) : 0;
      totalPaperCost += paperMultiplier > 1 ? (baseCostPerPage * totalPages) : 0;
    });

    return {
      method: 'student_credit',
      totalCost: totalBaseCost + totalColorCost + totalPaperCost,
      breakdown: {
        baseCost: totalBaseCost,
        colorCost: totalColorCost,
        paperCost: totalPaperCost,
      },
    };
  };

  const addCreatedJobId = (jobId: string) => {
    setCreatedJobIds(prev => [...prev, jobId]);
  };

  // Add local file (stores File object for later Cloudinary upload)
  const addLocalFile = useCallback(async (localFile: File) => {
    const fileId = crypto.randomUUID();

    console.log('📥 CONTEXT: Adding local file:', localFile.name, {
      fileId,
      fileType: localFile.type,
      fileSize: localFile.size,
      lastModified: localFile.lastModified
    });

    // Create initial file with the File object stored for payment access
    const initialFile: PrintJobFile = {
      id: fileId,
      name: localFile.name,
      size: localFile.size,
      type: localFile.name.split('.').pop()?.toLowerCase() || 'unknown',
      pages: 1, // Initial placeholder
      isImage: /\.(png|jpg|jpeg|gif|svg)$/i.test(localFile.name),
      format: localFile.name.split('.').pop()?.toLowerCase() || 'unknown',
      sizeKB: Math.round(localFile.size / 1024),
      // Store file object for access during payment
      file: localFile,
    };

    // Store File object in session state (not persisted to localStorage)
    setSessionFiles(prev => ({ ...prev, [fileId]: localFile }));

    console.log('✅ CONTEXT: File added to context with both file property and session storage');

    addFile(initialFile);

    console.log('📁 CONTEXT: File added to files array');

    // Parse document pages asynchronously
    try {
      const documentInfo = await parseDocumentPages(localFile);
      console.log(`Parsed ${localFile.name}: ${documentInfo.pages} pages (${documentInfo.type})`);

      // Update the file with accurate page count
      setFiles(prev => prev.map(file =>
        file.id === initialFile.id
          ? { ...file, pages: documentInfo.pages }
          : file
      ));
    } catch (error) {
      console.error(`Failed to parse ${localFile.name}:`, error);
      // Keep the fallback estimation
      const fallbackPages = estimatePages(localFile);
      setFiles(prev => prev.map(file =>
        file.id === initialFile.id
          ? { ...file, pages: fallbackPages }
          : file
      ));
    }
  }, []);

  // Estimate pages for local file
  const estimatePages = (file: File): number => {
    const ext = file.name.toLowerCase().split('.').pop();

    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif') {
      return 1; // Images are typically 1 page
    }

    if (ext === 'pdf') {
      // For PDFs, use a more conservative estimation
      // Small PDFs (<1MB) = assume 1 page
      // Medium PDFs (1-5MB) = rough estimation with 50KB per page
      // Large PDFs (>5MB) = rough estimation with 100KB per page
      if (file.size < 1024 * 1024) { // < 1MB
        return 1;
      } else if (file.size < 5 * 1024 * 1024) { // < 5MB
        return Math.max(1, Math.round(file.size / (50 * 1024)));
      } else {
        return Math.max(1, Math.round(file.size / (100 * 1024)));
      }
    }

    // For other documents, use original estimation
    return Math.max(1, Math.round(file.size / (500 * 1024)));
  };

  // Get session file (not persisted to localStorage)
  const getSessionFile = useCallback((fileId: string): File | undefined => {
    return sessionFiles[fileId];
  }, [sessionFiles]);

  // Update file with Cloudinary data after upload
  const updateFileWithCloudinaryData = useCallback((fileId: string, cloudinaryUrl: string, cloudinaryPublicId: string, format?: string, sizeKB?: number) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId
        ? {
          ...file,
          cloudinaryUrl,
          cloudinaryPublicId,
          format: format || file.format,
          sizeKB: sizeKB || file.sizeKB
          // Keep session file separate - don't modify it here
        }
        : file
    ));

    // Remove session file after successful upload since it's no longer needed
    setSessionFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fileId];
      return newFiles;
    });
  }, []);

  // Upload all local files to Cloudinary (called after payment)
  const uploadFilesToCloudinary = useCallback(async (): Promise<void> => {
    const localFiles = files.filter(file => file.file && !file.cloudinaryUrl);

    if (localFiles.length === 0) {
      return; // No local files to upload
    }

    // This would integrate with the upload hook
    // For now, we'll set up the structure - actual implementation will use useBackendUpload
    console.log(`📤 Uploading ${localFiles.length} files to Cloudinary after payment...`);

    // The actual implementation will be in the Payment component using useBackendUpload hook
  }, [files]);

  // Cleanup local files after successful payment (free memory and session storage)
  const cleanupLocalFiles = useCallback(() => {
    console.log('🧹 Context: Cleaning up local files after successful payment...');

    // Set cleanup flag to prevent saving base64 data
    setIsCleanedUp(true);

    // First, revoke any blob URLs to prevent memory leaks
    files.forEach(file => {
      if (file.cloudinaryUrl?.startsWith('blob:')) {
        console.log(`🗑️ Context: Revoking blob URL for: ${file.name}`);
        URL.revokeObjectURL(file.cloudinaryUrl);
      }
    });

    // Clear session storage files
    files.forEach(file => {
      const storageKey = `file_${file.id}`;
      if (sessionStorage.getItem(storageKey)) {
        console.log(`🗑️ Context: Removing from session storage: ${file.name}`);
        sessionStorage.removeItem(storageKey);
      }
    });

    // Clear session files map
    setSessionFiles({});

    // Completely clear the files array - payment complete, start fresh
    console.log('🗑️ Context: Clearing all files from state');
    setFiles([]);

    // Clear localStorage to prevent restoration
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Clear files array completely in localStorage
        parsed.files = [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        console.log('🗑️ Context: Cleared all files from localStorage');
      } catch (error) {
        console.warn('⚠️ Context: Failed to clean localStorage:', error);
      }
    }

    // Force garbage collection if available (development only)
    if (typeof window !== 'undefined' && 'gc' in window) {
      console.log('🗑️ Context: Triggering garbage collection');
      (window as typeof window & { gc: () => void }).gc();
    }

    console.log('✅ Context: Local file cleanup completed - all files cleared');
  }, [files]);

  const resetFlow = () => {
    setCurrentStep('upload');
    setFiles([]);
    setSettings({});
    setSelectedPrinter(null);
    setPayment(null);
    setIsCreatingJobs(false);
    setCreatedJobIds([]);
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: PrintJobContextType = useMemo(() => ({
    // Data
    currentStep,
    files,
    settings,
    selectedPrinter,
    payment,
    isCreatingJobs,
    createdJobIds,
    canProceed,

    // Actions
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    addFile,
    addLocalFile,
    removeFile,
    updateFileSettings,
    uploadFilesToCloudinary,
    updateFileWithCloudinaryData,
    getSessionFile,
    selectPrinter: setSelectedPrinter,
    setPaymentInfo: (paymentInfo) => setPayment(paymentInfo),
    setIsCreatingJobs,
    addCreatedJobId,
    cleanupLocalFiles,
    resetFlow,
  }), [
    currentStep,
    files,
    settings,
    selectedPrinter,
    payment,
    isCreatingJobs,
    createdJobIds,
    canProceed,
    goToNextStep,
    goToPreviousStep,
    addLocalFile,
    updateFileWithCloudinaryData,
    getSessionFile,
    uploadFilesToCloudinary,
    cleanupLocalFiles,
  ]);

  return (
    <PrintJobContext.Provider value={value}>
      {children}
    </PrintJobContext.Provider>
  );
}