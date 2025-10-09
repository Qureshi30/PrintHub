import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  XCircle, 
  Settings,
  CheckCircle
} from "lucide-react";
import { 
  CompatibilityResult, 
  CompatibilityIssue,
  PrintSettings,
  PrinterCapabilities,
  getSuggestedSettings
} from "@/utils/printerCompatibility";

interface PrinterCompatibilityAlertProps {
  compatibilityResult: CompatibilityResult;
  printerName: string;
  currentSettings: PrintSettings;
  capabilities: PrinterCapabilities;
}

export default function PrinterCompatibilityAlert({
  compatibilityResult,
  printerName,
  currentSettings,
  capabilities
}: Readonly<PrinterCompatibilityAlertProps>) {
  if (compatibilityResult.isCompatible && compatibilityResult.warnings.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">
          Settings Compatible
        </AlertTitle>
        <AlertDescription className="text-green-700">
          Your print settings are fully compatible with {printerName}.
        </AlertDescription>
      </Alert>
    );
  }

  const hasErrors = compatibilityResult.issues.length > 0;

  const suggestedSettings = getSuggestedSettings(currentSettings, capabilities);
  const hasSuggestions = Object.keys(suggestedSettings).length > 0;

  const renderIssue = (issue: CompatibilityIssue, index: number) => (
    <div key={index} className="flex items-start gap-2 mb-2 last:mb-0">
      <div className="flex-shrink-0 mt-0.5">
        {issue.severity === 'error' ? (
          <XCircle className="h-4 w-4 text-red-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <p className={`text-sm font-medium ${
          issue.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
        }`}>
          {issue.message}
        </p>
        <p className={`text-xs ${
          issue.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
        }`}>
          {issue.suggestion}
        </p>
      </div>
      <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'} className="text-xs">
        {issue.type}
      </Badge>
    </div>
  );

  return (
    <Alert className={`${
      hasErrors 
        ? 'border-red-200 bg-red-50' 
        : 'border-yellow-200 bg-yellow-50'
    }`}>
      <div className="flex items-start gap-2">
        {hasErrors ? (
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 space-y-3">
          <div>
            <AlertTitle className={hasErrors ? 'text-red-800' : 'text-yellow-800'}>
              {hasErrors ? 'Incompatible Print Settings' : 'Print Settings Warning'}
            </AlertTitle>
            <AlertDescription className={`mt-1 ${
              hasErrors ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {hasErrors 
                ? `Some settings are not compatible with ${printerName}. Please adjust before printing.`
                : `Some settings may need attention when printing with ${printerName}.`
              }
            </AlertDescription>
          </div>

          {/* Issues List */}
          <div className="space-y-2">
            {compatibilityResult.issues.map(renderIssue)}
            {compatibilityResult.warnings.map(renderIssue)}
          </div>

          {/* Suggested Settings */}
          {hasSuggestions && hasErrors && (
            <div className="bg-white/50 rounded-md p-3 border">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Suggested Compatible Settings:
                </span>
              </div>
              
              <div className="space-y-1 text-xs text-blue-700">
                {suggestedSettings.color !== undefined && (
                  <div>• Color: {suggestedSettings.color ? 'Enabled' : 'Disabled (Black & White)'}</div>
                )}
                {suggestedSettings.duplex !== undefined && (
                  <div>• Double-sided: {suggestedSettings.duplex ? 'Enabled' : 'Disabled (Single-sided)'}</div>
                )}
                {suggestedSettings.paperType && (
                  <div>• Paper: {suggestedSettings.paperType}</div>
                )}
                {Boolean(suggestedSettings.copies) && (
                  <div>• Copies: {suggestedSettings.copies}</div>
                )}
              </div>
            </div>
          )}


        </div>
      </div>
    </Alert>
  );
}