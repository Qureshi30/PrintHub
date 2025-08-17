import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Upload from "./pages/Upload";
import PrintSettings from "./pages/PrintSettings";
import SelectPrinter from "./pages/SelectPrinter";
import Confirmation from "./pages/Confirmation";
import Payment from "./pages/Payment";
import Queue from "./pages/Queue";
import History from "./pages/History";
import UserSettings from "./pages/UserSettings";
import AccessDenied from "./pages/AccessDenied";
import GroupPrint from "./pages/GroupPrint";
import Schedule from "./pages/Schedule";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Layout from "@/components/layout/Layout";



const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/upload" element={<Layout><Upload /></Layout>} />
          <Route path="/print-settings" element={<Layout><PrintSettings /></Layout>} />
          <Route path="/select-printer" element={<Layout><SelectPrinter /></Layout>} />
          <Route path="/confirmation" element={<Layout><Confirmation /></Layout>} />
          <Route path="/payment" element={<Layout><Payment /></Layout>} />
          <Route path="/queue" element={<Layout><Queue /></Layout>} />
          <Route path="/history" element={<Layout><History /></Layout>} />
          <Route path="/user-settings" element={<Layout><UserSettings /></Layout>} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/group-print" element={<Layout><GroupPrint /></Layout>} />
          <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
          <Route path="/support" element={<Layout><Support /></Layout>} />
          <Route path="/help" element={<Layout><Support /></Layout>} />
          <Route path="/terms" element={<Layout><Terms /></Layout>} />
          <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
