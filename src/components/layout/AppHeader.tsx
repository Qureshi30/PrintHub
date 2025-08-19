import { UploadCloud, Home, History, Clock, Calendar, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useUpload } from "@/context/UploadContext";
import AuthButtons from "@/components/auth/AuthButtons";
import { useNavigate, useLocation } from "react-router-dom";

export function AppHeader() {
  const { openFileDialog } = useUpload();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/upload", label: "Upload", icon: UploadCloud },
    { path: "/queue", label: "Queue", icon: Clock },
    { path: "/history", label: "History", icon: History },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            className="text-lg font-semibold tracking-tight text-blue-600 cursor-pointer hover:opacity-80 bg-transparent border-none"
            onClick={() => navigate("/")}
            aria-label="Go to PrintHub dashboard"
          >
            PrintHub
          </button>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 ${
                    isActive ? "bg-blue-600 text-white" : "hover:bg-blue-50"
                  }`}
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
          <Button 
            onClick={openFileDialog} 
            className="hover-scale bg-gradient-hero hover:shadow-glow transition-all duration-300" 
            aria-label="Upload files quickly"
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Quick Upload
          </Button>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
