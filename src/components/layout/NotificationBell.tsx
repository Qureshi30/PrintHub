import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";

interface NotificationBellProps {
  className?: string;
  iconSize?: string;
}

export function NotificationBell({ className = "", iconSize = "h-5 w-5" }: NotificationBellProps) {
  const navigate = useNavigate();
  const { notifications } = useSystemNotifications();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate("/notifications")}
      className={`relative hover:bg-blue-100 dark:hover:bg-blue-950 ${className}`}
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
    >
      <Bell className={iconSize} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
      )}
    </Button>
  );
}
