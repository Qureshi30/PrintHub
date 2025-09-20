import { createContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';

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
  method: 'student_credit' | 'card' | 'campus_card';
  totalCost: number;
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
  addLocalFile: (localFile: File) => void;
  removeFile: (fileId: string) => void;
  updateFileSettings: (fileId: string, settings: Partial<PrintJobSettings>) => void;
  
  // Cloudinary upload (after payment)
  uploadFilesToCloudinary: () => Promise<void>;
  updateFileWithCloudinaryData: (fileId: string, cloudinaryUrl: string, cloudinaryPublicId: string) => void;
  
  // Printer selection
  selectPrinter: (printer: SelectedPrinter) => void;
  
  // Payment
  setPaymentInfo: (payment: PaymentInfo) => void;
  
  // Job creation
  setIsCreatingJobs: (creating: boolean) => void;
  addCreatedJobId: (jobId: string) => void;
  
  // Reset
  resetFlow: () => void;
}

export interface PrintJobContextType extends PrintJobContextData, PrintJobContextActions {}

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

// Load state from localStorage
const loadStoredState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        currentStep: parsed.currentStep || 'upload',
        files: parsed.files || [],
        settings: parsed.settings || {},
        selectedPrinter: parsed.selectedPrinter || null,
        payment: parsed.payment || null,
      };
    }
  } catch (error) {
    console.warn('Failed to load print job state from localStorage:', error);
  }
  return {
    currentStep: 'upload' as PrintJobStep,
    files: [],
    settings: {},
    selectedPrinter: null,
    payment: null,
  };
};

// Save state to localStorage
const saveStateToStorage = (state: {
  currentStep: PrintJobStep;
  files: PrintJobFile[];
  settings: { [fileId: string]: PrintJobSettings };
  selectedPrinter: SelectedPrinter | null;
  payment: PaymentInfo | null;
}) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentStep: state.currentStep,
      files: state.files,
      settings: state.settings,
      selectedPrinter: state.selectedPrinter,
      payment: state.payment,
    }));
  } catch (error) {
    console.warn('Failed to save print job state to localStorage:', error);
  }
};

export function PrintJobProvider({ children }: { children: ReactNode }) {
  const storedState = loadStoredState();
  
  const [currentStep, setCurrentStep] = useState<PrintJobStep>(storedState.currentStep);
  const [files, setFiles] = useState<PrintJobFile[]>(storedState.files);
  const [settings, setSettings] = useState<{ [fileId: string]: PrintJobSettings }>(storedState.settings);
  const [selectedPrinter, setSelectedPrinter] = useState<SelectedPrinter | null>(storedState.selectedPrinter);
  const [payment, setPayment] = useState<PaymentInfo | null>(storedState.payment);
  const [isCreatingJobs, setIsCreatingJobs] = useState(false);
  const [createdJobIds, setCreatedJobIds] = useState<string[]>([]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveStateToStorage({
      currentStep,
      files,
      settings,
      selectedPrinter,
      payment,
    });
  }, [currentStep, files, settings, selectedPrinter, payment]);

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
  const addLocalFile = useCallback((localFile: File) => {
    const newFile: PrintJobFile = {
      id: crypto.randomUUID(),
      name: localFile.name,
      size: localFile.size,
      type: localFile.name.split('.').pop()?.toLowerCase() || 'unknown',
      pages: estimatePages(localFile),
      isImage: /\.(png|jpg|jpeg|gif|svg)$/i.test(localFile.name),
      format: localFile.name.split('.').pop()?.toLowerCase() || 'unknown',
      sizeKB: Math.round(localFile.size / 1024),
      file: localFile, // Store the File object for later upload
    };
    
    addFile(newFile);
  }, []);

  // Estimate pages for local file
  const estimatePages = (file: File): number => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif') {
      return 1; // Images are typically 1 page
    }
    // Rough estimation for documents (500KB per page)
    return Math.max(1, Math.round(file.size / (500 * 1024)));
  };

  // Update file with Cloudinary data after upload
  const updateFileWithCloudinaryData = useCallback((fileId: string, cloudinaryUrl: string, cloudinaryPublicId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, cloudinaryUrl, cloudinaryPublicId, file: undefined } // Remove local file reference
        : file
    ));
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
    selectPrinter: setSelectedPrinter,
    setPaymentInfo: (paymentInfo) => setPayment(paymentInfo),
    setIsCreatingJobs,
    addCreatedJobId,
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
    uploadFilesToCloudinary,
  ]);

  return (
    <PrintJobContext.Provider value={value}>
      {children}
    </PrintJobContext.Provider>
  );
}