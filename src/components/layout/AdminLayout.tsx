import { AdminHeader } from "@/components/layout/AdminHeader";
import { UploadProvider } from "@/context/UploadContext";
import { PrintJobProvider } from "@/context/PrintJobContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <UploadProvider>
      <PrintJobProvider>
        <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
          <div className="fixed inset-x-0 top-0 z-40">
            <AdminHeader />
          </div>

          <main className="pt-14 flex-1">
            {children}
          </main>

          {/* Admin Footer */}
          <footer className="border-t bg-red-50/50 backdrop-blur supports-[backdrop-filter]:bg-background/70 py-6 mt-auto">
            <div className="container">
              <div className="flex items-center justify-center">
                <div className="text-sm text-muted-foreground">
                  © 2025 PrintHub Admin Portal. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </PrintJobProvider>
    </UploadProvider>
  );
}
