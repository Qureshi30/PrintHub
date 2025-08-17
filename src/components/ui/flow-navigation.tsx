import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FlowNavigationProps {
  currentStep: string;
  nextStep?: string;
  nextLabel?: string;
  onNext?: () => void;
  canProceed?: boolean;
  showSummary?: boolean;
}

export function FlowNavigation({
  currentStep,
  nextStep,
  nextLabel = "Continue",
  onNext,
  canProceed = true,
  showSummary = false
}: FlowNavigationProps) {
  const navigate = useNavigate();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (nextStep) {
      navigate(nextStep);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!nextStep && !onNext) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50 mt-8">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Ready to continue</span>
            {showSummary && (
              <span className="text-xs text-muted-foreground ml-2">
                Your selections have been saved
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBack}>
              Back
            </Button>
            <Button 
              size="sm" 
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-gradient-hero"
            >
              {nextLabel}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
