import { 
  Users, 
  Printer, 
  BarChart3, 
  Home,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-30 border-b bg-red-50/80 backdrop-blur supports-[backdrop-filter]:bg-red-50/70 border-red-200">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
              className="text-lg font-semibold tracking-tight text-red-600 cursor-pointer hover:opacity-80 bg-transparent border-none flex items-center gap-2"
              onClick={() => navigate("/admin")}
              aria-label="Go to Admin Dashboard"
            >
              <Shield className="h-5 w-5" />
              PrintHub Admin
            </button>
            <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
              Admin Portal
            </Badge>
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
                  className={`flex items-center gap-2 transition-colors !outline-none !ring-0 focus:!outline-none focus:!ring-red-500 focus:!ring-2 focus:!ring-offset-2 active:!bg-red-700 active:!outline-none border-0 focus:border-0 active:border-0 ${
                    isActive 
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
