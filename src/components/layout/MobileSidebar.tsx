import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Upload, List, History, Calendar, Bell } from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: Home, path: "/student/dashboard" },
  { name: "Upload", icon: Upload, path: "/upload" },
  { name: "Queue", icon: List, path: "/queue" },
  { name: "History", icon: History, path: "/history" },
  { name: "Schedule", icon: Calendar, path: "/schedule" },
  { name: "Notifications", icon: Bell, path: "/notifications" },
];

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="lg:hidden">
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white shadow-md"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40" onClick={() => setOpen(false)} />
      )}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Sidebar menu"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-6 w-6" />
          </button>
        </div>
        <ul className="mt-4">
          {menuItems.map(item => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors ${location.pathname === item.path ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"}`}
                onClick={() => setOpen(false)}
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
