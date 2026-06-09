import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Home } from "./pages/Home";
import { OfficialTeams } from "./pages/OfficialTeams";
import { ColorCodeSelector } from "./pages/ColorCodeSelector";
import { FAQ } from "./pages/FAQ";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { CookiePolicy } from "./pages/CookiePolicy";
import { Sponsorships } from "./pages/Sponsorships";
import { Appeal } from "./pages/Appeal";

import NotFound from "./pages/NotFound";
import { Footer } from "./components/Footer";
import { CookieConsent } from "./components/CookieConsent";
import { OfflineNotice } from "./components/OfflineNotice";

const queryClient = new QueryClient();

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navigation onAdminAccess={setIsAdmin} isAdmin={isAdmin} />
            <Routes>
              <Route path="/" element={<Home isAdmin={isAdmin} />} />
              <Route path="/teams" element={<OfficialTeams isAdmin={isAdmin} />} />
              <Route path="/color-selector" element={<ColorCodeSelector isAdmin={isAdmin} />} />
              <Route path="/sponsorships" element={<Sponsorships isAdmin={isAdmin} />} />
              <Route path="/appeal" element={<Appeal isAdmin={isAdmin} />} />
              <Route path="/faq" element={<FAQ isAdmin={isAdmin} />} />
              <Route path="/policy/privacy" element={<PrivacyPolicy />} />
              <Route path="/policy/cookie" element={<CookiePolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        <CookieConsent />
        <OfflineNotice />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
