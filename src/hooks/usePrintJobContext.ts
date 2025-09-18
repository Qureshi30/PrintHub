import { useContext } from 'react';
import { PrintJobContext, PrintJobContextType } from '../context/PrintJobFlowContext';

export function usePrintJobContext(): PrintJobContextType {
  const context = useContext(PrintJobContext);
  if (context === undefined) {
    throw new Error('usePrintJobContext must be used within a PrintJobProvider');
  }
  return context;
}