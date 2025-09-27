import { ChevronRight, Check } from "lucide-react";

interface BreadcrumbStep {
  label: string;
  path: string;
  completed?: boolean;
  current?: boolean;
}

interface PrintFlowBreadcrumbProps {
  currentStep: string;
}

export function PrintFlowBreadcrumb({ currentStep }: PrintFlowBreadcrumbProps) {
  const steps: BreadcrumbStep[] = [
    { label: "Upload", path: "/upload" },
    { label: "Settings", path: "/print-settings" },
    { label: "Printer", path: "/select-printer" },
    { label: "Confirm", path: "/confirmation" },
    { label: "Payment", path: "/payment" },
    { label: "Queue", path: "/queue" }
  ];

  const currentStepIndex = steps.findIndex(step => step.path === currentStep);
  
  const stepsWithStatus = steps.map((step, index) => ({
    ...step,
    completed: index < currentStepIndex,
    current: index === currentStepIndex
  }));

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-2 bg-card/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-border">
        {stepsWithStatus.map((step, index) => (
          <div key={step.path} className="flex items-center">
            <div className={`flex items-center space-x-2 ${
              step.current ? 'text-blue-600 dark:text-blue-400 font-medium' : 
              step.completed ? 'text-green-600 dark:text-green-400' : 
              'text-muted-foreground'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step.current ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-600 dark:border-blue-400' :
                step.completed ? 'bg-green-100 dark:bg-green-900/50' :
                'bg-muted'
              }`}>
                {step.completed ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className={step.current ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}>{index + 1}</span>
                )}
              </div>
              <span className="text-sm">{step.label}</span>
            </div>
            {index < stepsWithStatus.length - 1 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/60 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
