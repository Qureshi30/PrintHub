import { AppHeader } from "./AppHeader";
import { UploadProvider } from "@/context/UploadContext";
import { PrintJobProvider } from "@/context/PrintJobContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UploadProvider>
      <PrintJobProvider>
        <div className="min-h-screen w-full bg-background text-foreground">
          <div className="fixed inset-x-0 top-0 z-40">
            <AppHeader />
          </div>

          <main className="pt-14">
            {children}
          </main>
        </div>
      </PrintJobProvider>
    </UploadProvider>
  );
}
