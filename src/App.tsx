import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignedIn, SignedOut } from '@clerk/clerk-react';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import StudentDashboard from "./pages/student/StudentDashboard";
import NotFound from "./pages/shared/NotFound";
import Upload from "./pages/student/Upload";
import PrintSettings from "./pages/student/PrintSettings";
import SelectPrinter from "./pages/student/SelectPrinter";
import Confirmation from "./pages/student/Confirmation";
import Payment from "./pages/student/Payment";
import Queue from "./pages/student/Queue";
import History from "./pages/student/History";
import UserSettings from "./pages/student/UserSettings";
import AccessDenied from "./pages/shared/AccessDenied";
import Schedule from "./pages/student/Schedule";
import Support from "./pages/shared/Support";
import Terms from "./pages/shared/Terms";
import Privacy from "./pages/shared/Privacy";
import Notifications from "./pages/student/Notifications";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import PrinterManagement from "./pages/admin/PrinterManagement";
import Analytics from "./pages/admin/Analytics";
import EmailConfiguration from "./pages/admin/EmailConfiguration";
import Layout from "@/components/layout/Layout";
import LandingLayout from "@/components/layout/LandingLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Feature Pages
import SecurityPrivacy from "./pages/features/SecurityPrivacy";
import SchedulePrintJob from "./pages/features/SchedulePrintJob";
import PrintTracking from "./pages/features/PrintTracking";
import PrintHistory from "./pages/features/PrintHistory";
import NotificationFeatures from "./pages/features/NotificationFeatures";
import NoQueueWaiting from "./pages/features/NoQueueWaiting";



const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing page for non-authenticated users */}
          <Route path="/" element={
            <>
              <SignedOut>
                <LandingLayout><Index /></LandingLayout>
              </SignedOut>
              <SignedIn>
                <Layout><StudentDashboard /></Layout>
              </SignedIn>
            </>
          } />
          
          {/* Student routes (require authentication) */}
          <Route path="/dashboard" element={<Layout><StudentDashboard /></Layout>} />
          <Route path="/upload" element={<Layout><Upload /></Layout>} />
          <Route path="/print-settings" element={<Layout><PrintSettings /></Layout>} />
          <Route path="/select-printer" element={<Layout><SelectPrinter /></Layout>} />
          <Route path="/confirmation" element={<Layout><Confirmation /></Layout>} />
          <Route path="/payment" element={<Layout><Payment /></Layout>} />
          <Route path="/queue" element={<Layout><Queue /></Layout>} />
          <Route path="/history" element={<Layout><History /></Layout>} />
          <Route path="/user-settings" element={<Layout><UserSettings /></Layout>} />
          <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
          <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
          
          {/* Shared routes (available to both authenticated and non-authenticated users) */}
          <Route path="/support" element={
            <>
              <SignedOut>
                <LandingLayout><Support /></LandingLayout>
              </SignedOut>
              <SignedIn>
                <Layout><Support /></Layout>
              </SignedIn>
            </>
          } />
          <Route path="/help" element={
            <>
              <SignedOut>
                <LandingLayout><Support /></LandingLayout>
              </SignedOut>
              <SignedIn>
                <Layout><Support /></Layout>
              </SignedIn>
            </>
          } />
          <Route path="/terms" element={
            <>
              <SignedOut>
                <LandingLayout><Terms /></LandingLayout>
              </SignedOut>
              <SignedIn>
                <Layout><Terms /></Layout>
              </SignedIn>
            </>
          } />
          <Route path="/privacy" element={
            <>
              <SignedOut>
                <LandingLayout><Privacy /></LandingLayout>
              </SignedOut>
              <SignedIn>
                <Layout><Privacy /></Layout>
              </SignedIn>
            </>
          } />
          
          <Route path="/access-denied" element={<AccessDenied />} />
          
          {/* Feature Pages */}
          <Route path="/features/security-privacy" element={<Layout><SecurityPrivacy /></Layout>} />
          <Route path="/features/schedule-print-job" element={<Layout><SchedulePrintJob /></Layout>} />
          <Route path="/features/print-tracking" element={<Layout><PrintTracking /></Layout>} />
          <Route path="/features/print-history" element={<Layout><PrintHistory /></Layout>} />
          <Route path="/features/notifications" element={<Layout><NotificationFeatures /></Layout>} />
          <Route path="/features/no-queue-waiting" element={<Layout><NoQueueWaiting /></Layout>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
          <Route path="/admin/printers" element={<AdminLayout><PrinterManagement /></AdminLayout>} />
          <Route path="/admin/analytics" element={<AdminLayout><Analytics /></AdminLayout>} />
          <Route path="/admin/email" element={<AdminLayout><EmailConfiguration /></AdminLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
