import React from 'react';
import { ChevronLeft, Home, Menu, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
  showHomeButton?: boolean;
  rightAction?: React.ReactNode;
  onMenuClick?: () => void;
}

export function MobileHeader({ 
  title, 
  showBackButton = true, 
  backTo, 
  showHomeButton = false,
  rightAction,
  onMenuClick
}: MobileHeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    navigate('/student/dashboard');
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-b border-border px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </button>
          )}
          
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 h-auto hover:bg-blue-100 dark:hover:bg-blue-900/20 flex-shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          {showHomeButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHome}
              className="p-2 h-auto hover:bg-blue-100 dark:hover:bg-blue-900/20 flex-shrink-0"
            >
              <Home className="h-5 w-5" />
            </Button>
          )}
          
          <h1 className="text-lg font-semibold text-foreground truncate flex-1 ml-2">
            {title}
          </h1>
        </div>
        
        {rightAction && (
          <div className="flex items-center ml-3 flex-shrink-0">
            {rightAction}
          </div>
        )}
      </div>
    </div>
  );
}
