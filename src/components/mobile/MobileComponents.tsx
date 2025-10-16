import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function MobileCard({ 
  children, 
  className, 
  onClick, 
  selected = false, 
  disabled = false,
  padding = 'md'
}: MobileCardProps) {
  const isMobile = useIsMobile();
  
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  if (isMobile) {
    return (
      <Card 
        className={cn(
          "w-full transition-all duration-200",
          selected && "ring-2 ring-blue-500 border-blue-500",
          onClick && !disabled && "cursor-pointer hover:shadow-md active:scale-[0.98]",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <CardContent className={paddingClasses[padding]}>
          {children}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        selected && "ring-2 ring-blue-500 border-blue-500",
        onClick && !disabled && "cursor-pointer hover:shadow-md",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <CardContent className={paddingClasses[padding]}>
        {children}
      </CardContent>
    </Card>
  );
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function MobileActionSheet({ isOpen, onClose, title, children }: MobileActionSheetProps) {
  const isMobile = useIsMobile();

  if (!isMobile || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] overflow-hidden">
        {title && (
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-center">{title}</h3>
          </div>
        )}
        <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

interface MobileTouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function MobileTouchButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className 
}: MobileTouchButtonProps) {
  const isMobile = useIsMobile();
  
  const sizeClasses = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-12 px-4 text-base',
    lg: 'h-14 px-6 text-lg'
  };

  if (isMobile) {
    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        variant={variant === 'primary' ? 'default' : variant === 'secondary' ? 'outline' : 'ghost'}
        className={cn(
          "w-full touch-manipulation active:scale-[0.98] transition-transform",
          sizeClasses[size],
          className
        )}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant === 'primary' ? 'default' : variant === 'secondary' ? 'outline' : 'ghost'}
      className={className}
    >
      {children}
    </Button>
  );
}