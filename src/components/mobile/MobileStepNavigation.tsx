import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface MobileStepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  nextDisabled?: boolean;
  previousDisabled?: boolean;
  showProgress?: boolean;
}

export function MobileStepNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  nextLabel = "Next",
  previousLabel = "Back",
  nextDisabled = false,
  previousDisabled = false,
  showProgress = true
}: MobileStepNavigationProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 lg:hidden">
      {showProgress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={previousDisabled}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {previousLabel}
        </Button>
        
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}