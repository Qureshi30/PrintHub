import { AppHeader } from "./AppHeader";
import { UploadProvider } from "@/context/UploadContext";
import { PrintJobProvider } from "@/context/PrintJobContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

export default function Layout({ children }: { readonly children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <UploadProvider>
      <PrintJobProvider>
        <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
          <div className="fixed inset-x-0 top-0 z-40">
            <AppHeader />
          </div>

          <main className="pt-14 flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 py-6 mt-auto">
            <div className="container">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  © 2025 PrintHub. All rights reserved.
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Button variant="link" size="sm" onClick={() => navigate("/terms")} className="h-auto p-0">
                    Terms of Service
                  </Button>
                  <Separator orientation="vertical" className="h-4" />
                  <Button variant="link" size="sm" onClick={() => navigate("/privacy")} className="h-auto p-0">
                    Privacy Policy
                  </Button>
                  <Separator orientation="vertical" className="h-4" />
                  <Button variant="link" size="sm" onClick={() => navigate("/support")} className="h-auto p-0">
                    Help & Support
                  </Button>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </PrintJobProvider>
    </UploadProvider>
  );
}
