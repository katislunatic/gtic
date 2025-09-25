import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Home } from "./pages/Home";
import { TournamentBracket } from "./pages/TournamentBracket";
import { OfficialTeams } from "./pages/OfficialTeams";
import { HallOfFame } from "./pages/HallOfFame";

import NotFound from "./pages/NotFound";

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
              <Route path="/bracket" element={<TournamentBracket isAdmin={isAdmin} />} />
              <Route path="/teams" element={<OfficialTeams isAdmin={isAdmin} />} />
              <Route path="/hall-of-fame" element={<HallOfFame isAdmin={isAdmin} />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
