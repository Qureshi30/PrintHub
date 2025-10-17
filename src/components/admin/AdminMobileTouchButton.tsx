import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AdminMobileTouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
}

export function AdminMobileTouchButton({
  children,
  onClick,
  variant = "default",
  size = "default",
  className,
  disabled = false,
  loading = false,
  icon: Icon,
  fullWidth = false
}: AdminMobileTouchButtonProps) {
  const sizeClasses = {
    sm: "h-10 px-4 text-sm",
    default: "h-12 px-6 text-base",
    lg: "h-14 px-8 text-lg"
  };

  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "transition-all duration-200 active:scale-[0.98] touch-manipulation",
        "focus:ring-2 focus:ring-offset-2",
        sizeClasses[size],
        fullWidth && "w-full",
        variant === "default" && "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        variant === "destructive" && "focus:ring-red-500",
        variant === "outline" && "border-blue-200 text-blue-700 hover:bg-blue-50 focus:ring-blue-500",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {loading ? "Loading..." : children}
      </div>
    </Button>
  );
}