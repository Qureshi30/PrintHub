/**
 * Printer Compatibility Validation Utility
 * Validates if print settings are compatible with printer capabilities
 */

export interface PrinterCapabilities {
  colorSupport: boolean;
  duplexSupport: boolean;
  supportedPaperTypes: string[];
  maxCopies?: number;
}

export interface PrintSettings {
  color: boolean;
  duplex: boolean;
  paperType: string;
  copies: number;
}

export interface CompatibilityIssue {
  type: 'color' | 'duplex' | 'paperType' | 'copies';
  message: string;
  severity: 'error' | 'warning';
  suggestion: string;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: CompatibilityIssue[];
}

/**
 * Validates print settings against printer capabilities
 */
export function validatePrinterCompatibility(
  settings: PrintSettings,
  capabilities: PrinterCapabilities
): CompatibilityResult {
  const issues: CompatibilityIssue[] = [];
  const warnings: CompatibilityIssue[] = [];

  // Check color compatibility
  if (settings.color && !capabilities.colorSupport) {
    issues.push({
      type: 'color',
      message: 'This printer does not support color printing',
      severity: 'error',
      suggestion: 'Switch to black & white printing or select a color-capable printer'
    });
  }

  // Check duplex compatibility
  if (settings.duplex && !capabilities.duplexSupport) {
    issues.push({
      type: 'duplex',
      message: 'This printer does not support double-sided printing',
      severity: 'error', 
      suggestion: 'Switch to single-sided printing or select a duplex-capable printer'
    });
  }

  // Check paper type compatibility
  if (!capabilities.supportedPaperTypes.includes(settings.paperType)) {
    // Check if it's a close match (like Certificate -> A4)
    if (settings.paperType === 'Certificate' && capabilities.supportedPaperTypes.includes('A4')) {
      warnings.push({
        type: 'paperType',
        message: 'Certificate paper will be printed on A4',
        severity: 'warning',
        suggestion: 'The printer will use A4 paper size for certificate documents'
      });
    } else {
      issues.push({
        type: 'paperType',
        message: `This printer does not support ${settings.paperType} paper`,
        severity: 'error',
        suggestion: `Use one of these supported paper types: ${capabilities.supportedPaperTypes.join(', ')}`
      });
    }
  }

  // Check copy limit
  if (capabilities.maxCopies && settings.copies > capabilities.maxCopies) {
    issues.push({
      type: 'copies',
      message: `Maximum ${capabilities.maxCopies} copies allowed for this printer`,
      severity: 'error',
      suggestion: `Reduce copies to ${capabilities.maxCopies} or less`
    });
  }

  return {
    isCompatible: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Get suggested compatible settings for a printer
 */
export function getSuggestedSettings(
  currentSettings: PrintSettings,
  capabilities: PrinterCapabilities
): Partial<PrintSettings> {
  const suggestions: Partial<PrintSettings> = {};

  // Color fallback
  if (currentSettings.color && !capabilities.colorSupport) {
    suggestions.color = false;
  }

  // Duplex fallback
  if (currentSettings.duplex && !capabilities.duplexSupport) {
    suggestions.duplex = false;
  }

  // Paper type fallback
  if (!capabilities.supportedPaperTypes.includes(currentSettings.paperType)) {
    // Prefer A4 as fallback, or first supported type
    suggestions.paperType = capabilities.supportedPaperTypes.includes('A4') 
      ? 'A4' 
      : capabilities.supportedPaperTypes[0];
  }

  // Copy limit
  if (capabilities.maxCopies && currentSettings.copies > capabilities.maxCopies) {
    suggestions.copies = capabilities.maxCopies;
  }

  return suggestions;
}

/**
 * Format compatibility issues for display
 */
export function formatCompatibilityMessage(issues: CompatibilityIssue[]): string {
  if (issues.length === 0) return '';
  
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  
  let message = '';
  if (errorCount > 0) {
    message += `${errorCount} compatibility issue${errorCount > 1 ? 's' : ''}`;
  }
  if (warningCount > 0) {
    if (message) message += ' and ';
    message += `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
  }
  
  return message;
}