import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Users, Printer, BarChart3, Home, Mail, Shield } from "lucide-react";

const adminMenuItems = [
  { name: "Dashboard", icon: Home, path: "/admin" },
  { name: "Users", icon: Users, path: "/admin/users" },
  { name: "Printers", icon: Printer, path: "/admin/printers" },
  { name: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { name: "Email Config", icon: Mail, path: "/admin/email" },
];

interface AdminMobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminMobileSidebar({ open, onOpenChange }: AdminMobileSidebarProps) {
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
        aria-label="Admin sidebar menu"
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <span className="font-bold text-lg text-white">PrintHub Admin</span>
          </div>
          <button 
            onClick={() => onOpenChange(false)} 
            aria-label="Close menu"
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700 shadow-sm"
                    : "text-foreground hover:bg-accent active:bg-accent/80"
                }`}
                aria-label={`Navigate to ${item.name}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground text-center">
            © 2025 PrintHub Admin
          </div>
        </div>
      </nav>
    </div>
  );
}