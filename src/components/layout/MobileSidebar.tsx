import { Link, useLocation } from "react-router-dom";
import { X, Home, Upload, List, History, Printer } from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: Home, path: "/student/dashboard" },
  { name: "Upload", icon: Upload, path: "/upload" },
  { name: "Queue", icon: List, path: "/queue" },
  { name: "History", icon: History, path: "/history" },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation();

  return (
    <div className="lg:hidden">
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40" onClick={() => onOpenChange(false)} />
      )}
      
      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-background shadow-lg z-50 transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Sidebar menu"
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Printer className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-bold text-lg text-white">PrintHub</span>
          </div>
          <button 
            onClick={() => onOpenChange(false)} 
            aria-label="Close menu"
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
        <ul className="mt-4">
          {menuItems.map(item => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors ${location.pathname === item.path ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700" : "hover:bg-accent text-foreground"}`}
                onClick={() => onOpenChange(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
