import React from 'react';
import { ChevronLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
  showHomeButton?: boolean;
  rightAction?: React.ReactNode;
}

export function MobileHeader({ 
  title, 
  showBackButton = true, 
  backTo, 
  showHomeButton = false,
  rightAction 
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
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm lg:hidden">
      <div className="flex items-center space-x-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2 h-auto"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        {showHomeButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHome}
            className="p-2 h-auto"
          >
            <Home className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {title}
        </h1>
      </div>
      
      {rightAction && (
        <div className="flex items-center">
          {rightAction}
        </div>
      )}
    </header>
  );
}