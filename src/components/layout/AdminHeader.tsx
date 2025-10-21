import {
  Users,
  Printer,
  BarChart3,
  Home,
  Shield,
  Mail,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import AuthButtons from "@/components/auth/AuthButtons";
import { useNavigate, useLocation } from "react-router-dom";

export function AdminHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const adminNavItems = [
    { path: "/admin", label: "Dashboard", icon: Home },
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/printers", label: "Printers", icon: Printer },
    { path: "/admin/error-logs", label: "Error Logs", icon: Shield },
    { path: "/admin/cash-payments", label: "Cash Payments", icon: DollarSign },
    { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/admin/email", label: "Email", icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-blue-200 dark:border-blue-800">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
              className="text-lg font-semibold tracking-tight text-blue-600 dark:text-blue-400 cursor-pointer hover:opacity-80 bg-transparent border-none flex items-center gap-2"
              onClick={() => navigate("/admin")}
              aria-label="Go to Admin Dashboard"
            >
              <Shield className="h-5 w-5" />
              PrintHub Admin
            </button>
          </div>

          {/* Admin Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                navigate(item.path);
                // Remove focus to eliminate persistent outline
                e.currentTarget.blur();
              };

              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={handleClick}
                  className={`flex items-center gap-2 transition-colors !outline-none !ring-0 focus:!outline-none focus:!ring-blue-500 focus:!ring-2 focus:!ring-offset-2 active:!bg-blue-700 active:!outline-none border-0 focus:border-0 active:border-0 ${
                    isActive 
                      ? "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700" 
                      : "hover:bg-blue-100 text-blue-700 focus:bg-blue-100 active:bg-blue-200"
                  }`}
                  className={`flex items-center gap-2 transition-colors !outline-none !ring-0 focus:!outline-none focus:!ring-red-500 focus:!ring-2 focus:!ring-offset-2 active:!bg-red-700 active:!outline-none border-0 focus:border-0 active:border-0 ${isActive
                      ? "bg-red-600 text-white hover:bg-red-700 focus:bg-red-700"
                      : "hover:bg-red-100 text-red-700 focus:bg-red-100 active:bg-red-200"
                    }`}
                  style={{ outline: 'none', border: 'none' }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
