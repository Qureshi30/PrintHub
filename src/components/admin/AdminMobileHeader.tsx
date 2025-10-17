import { ArrowLeft, Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminMobileHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  onMenuClick?: () => void;
}

export function AdminMobileHeader({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  rightAction,
  onMenuClick
}: AdminMobileHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-b border-red-200 dark:border-red-800">
      <div className="px-4 py-3">
        {/* Title row with hamburger menu, title and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0 mr-6">
            {/* Hamburger Menu Button */}
            <button
              onClick={onMenuClick}
              className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-red-700 dark:text-red-400" />
            </button>
            
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-lg text-foreground truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
          
          {rightAction && (
            <div className="flex-shrink-0">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}