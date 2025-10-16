import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminMobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  onClick?: () => void;
  hover?: boolean;
}

export function AdminMobileCard({ 
  children, 
  className, 
  padding = "md",
  onClick,
  hover = false
}: AdminMobileCardProps) {
  const paddingClasses = {
    sm: "p-3",
    md: "p-4", 
    lg: "p-6"
  };

  return (
    <Card 
      className={cn(
        "border border-border bg-card shadow-sm",
        hover && "transition-all duration-200 active:scale-[0.98] active:shadow-lg",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn(paddingClasses[padding])}>
        {children}
      </CardContent>
    </Card>
  );
}