import { ThemeToggle } from "@/components/ui/theme-toggle";
import AuthButtons from "@/components/auth/AuthButtons";
import { useNavigate } from "react-router-dom";

export function LandingHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            className="text-lg font-semibold tracking-tight text-blue-600 cursor-pointer hover:opacity-80 bg-transparent border-none"
            onClick={() => navigate("/")}
            aria-label="Go to PrintHub homepage"
          >
            PrintHub
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
