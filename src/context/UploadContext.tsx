import React, { createContext, useContext, useMemo, useState } from "react";

type UploadContextType = {
  openFileDialog: () => void;
  registerOpenDialog: (fn: () => void) => void;
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openFn, setOpenFn] = useState<() => void>(() => () => {});

  const value = useMemo(
    () => ({
      openFileDialog: () => openFn?.(),
      registerOpenDialog: (fn: () => void) => setOpenFn(() => fn),
    }),
    [openFn]
  );

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within an UploadProvider");
  return ctx;
}
