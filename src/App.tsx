import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignedIn, SignedOut } from '@clerk/clerk-react';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
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
import { PrintJobProvider } from "./context/PrintJobFlowContext";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import PrinterManagement from "./pages/admin/PrinterManagement";
import Analytics from "./pages/admin/Analytics";
import EmailConfiguration from "./pages/admin/EmailConfiguration";
import AuthTestPage from "./pages/AuthTestPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import Layout from "@/components/layout/Layout";
import LandingLayout from "@/components/layout/LandingLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import RoleBasedDashboard from "@/components/RoleBasedDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
      <PrintJobProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing page for non-authenticated users */}
            <Route path="/" element={
              <>
                <SignedOut>
                  <LandingLayout><Index /></LandingLayout>
                </SignedOut>
                <SignedIn>
                  <RoleBasedDashboard />
                </SignedIn>
              </>
            } />
            
            {/* Dashboard route that uses role-based rendering */}
            <Route path="/dashboard" element={
              <SignedIn>
                <RoleBasedDashboard />
              </SignedIn>
            } />
            {/* Student routes (require authentication) */}
            <Route path="/student/dashboard" element={<SignedIn><Layout><StudentDashboard /></Layout></SignedIn>} />
            
            {/* Print flow routes */}
            <Route path="/upload" element={<SignedIn><Layout><Upload /></Layout></SignedIn>} />
            <Route path="/print-settings" element={<SignedIn><Layout><PrintSettings /></Layout></SignedIn>} />
            <Route path="/student/print-settings" element={<SignedIn><Layout><PrintSettings /></Layout></SignedIn>} />
            <Route path="/select-printer" element={<SignedIn><Layout><SelectPrinter /></Layout></SignedIn>} />
            <Route path="/student/select-printer" element={<SignedIn><Layout><SelectPrinter /></Layout></SignedIn>} />
          <Route path="/confirmation" element={<SignedIn><Layout><Confirmation /></Layout></SignedIn>} />
          <Route path="/payment" element={<SignedIn><Layout><Payment /></Layout></SignedIn>} />
          <Route path="/queue" element={<SignedIn><Layout><Queue /></Layout></SignedIn>} />
          <Route path="/history" element={<SignedIn><Layout><History /></Layout></SignedIn>} />
          <Route path="/user-settings" element={<SignedIn><Layout><UserSettings /></Layout></SignedIn>} />
          <Route path="/schedule" element={<SignedIn><Layout><Schedule /></Layout></SignedIn>} />
          <Route path="/notifications" element={<SignedIn><Layout><Notifications /></Layout></SignedIn>} />
          
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
          
          {/* Test route for authentication */}
          <Route path="/auth-test" element={<SignedIn><Layout><AuthTestPage /></Layout></SignedIn>} />
          
          {/* Feature Pages */}
          <Route path="/features/security-privacy" element={<Layout><SecurityPrivacy /></Layout>} />
          <Route path="/features/schedule-print-job" element={<Layout><SchedulePrintJob /></Layout>} />
          <Route path="/features/print-tracking" element={<Layout><PrintTracking /></Layout>} />
          <Route path="/features/print-history" element={<Layout><PrintHistory /></Layout>} />
          <Route path="/features/notifications" element={<Layout><NotificationFeatures /></Layout>} />
          <Route path="/features/no-queue-waiting" element={<Layout><NoQueueWaiting /></Layout>} />
          
          {/* Admin Routes - require admin role */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><AdminDashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><UserManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/printers" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><PrinterManagement /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><Analytics /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/email" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><EmailConfiguration /></AdminLayout>
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </PrintJobProvider>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
