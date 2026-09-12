import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { LiquidGlassDefs } from "@/components/LiquidGlassDefs";
import { LoadingDots } from "@/components/LoadingDots";
import { Home } from "./pages/Home";
import { CartProvider } from "@/hooks/use-cart";
import { useSiteSettings } from "@/hooks/use-site-settings";

const OfficialTeams = lazy(() => import("./pages/OfficialTeams").then((m) => ({ default: m.OfficialTeams })));
const ColorCodeSelector = lazy(() => import("./pages/ColorCodeSelector").then((m) => ({ default: m.ColorCodeSelector })));
const FAQ = lazy(() => import("./pages/FAQ").then((m) => ({ default: m.FAQ })));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy").then((m) => ({ default: m.PrivacyPolicy })));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy").then((m) => ({ default: m.CookiePolicy })));
const Sponsorships = lazy(() => import("./pages/Sponsorships").then((m) => ({ default: m.Sponsorships })));
const Bracket = lazy(() => import("./pages/Bracket").then((m) => ({ default: m.Bracket })));
const Voting = lazy(() => import("./pages/Voting").then((m) => ({ default: m.Voting })));
const Shop = lazy(() => import("./pages/Shop").then((m) => ({ default: m.Shop })));
const ShopProduct = lazy(() => import("./pages/ShopProduct").then((m) => ({ default: m.ShopProduct })));
const ShippingReturns = lazy(() => import("./pages/ShippingReturns").then((m) => ({ default: m.ShippingReturns })));
const Staff = lazy(() => import("./pages/Staff").then((m) => ({ default: m.Staff })));
const Credits = lazy(() => import("./pages/Credits").then((m) => ({ default: m.Credits })));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const DiscordCallback = lazy(() => import("./pages/DiscordCallback"));
const Officials = lazy(() => import("./pages/Officials").then((m) => ({ default: m.Officials })));
const NotFound = lazy(() => import("./pages/NotFound"));

import { Footer } from "./components/Footer";
import { CookieConsent } from "./components/CookieConsent";
import { AiChatWidget } from "./components/AiChatWidget";
import { OfflineGate } from "./components/OfflineGate";
import { MaintenancePage } from "./components/MaintenancePage";
import { trackPageView } from "@/lib/analytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep cached data around long enough to survive a page reload and be
      // reused instantly from localStorage before the network refetch lands.
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Persists the query cache (Teams, Staff, etc.) to localStorage. On a fresh
// page load, cached results render immediately instead of an empty state
// while the real fetch is still in flight; React Query then quietly
// refetches in the background and updates once the network responds.
const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "gtec-query-cache",
});

// Fades each route in on mount and resets scroll position — gives
// navigation a bit of life instead of an instant hard cut.
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in">
      {children}
    </div>
  );
};

// Records an anonymous page view on every route change — but only once the
// cookie banner has actually been accepted (see src/lib/analytics.ts). This
// is what makes the cookie consent banner functionally mean something,
// rather than existing purely for show.
const AnalyticsTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
};

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <LoadingDots />
  </div>
);

// Gates the shop routes behind the shop_enabled site setting. When disabled,
// non-admins get NotFound (as if the route never existed); admins still see
// the real page underneath so they can keep managing products while it's
// hidden from everyone else.
const ShopGate = ({ isAdmin, children }: { isAdmin: boolean; children: React.ReactNode }) => {
  const { settings, loading } = useSiteSettings();
  if (loading) return <RouteFallback />;
  const shopEnabled = settings.shop_enabled !== "false";
  if (!shopEnabled && !isAdmin) return <NotFound />;
  return <>{children}</>;
};

// Gates the AI chat widget behind the ai_enabled site setting, same pattern
// as ShopGate: hidden from non-admins when disabled, still visible to admins
// so they can test it while it's off for everyone else.
const AiChatGate = ({ isAdmin }: { isAdmin: boolean }) => {
  const { settings } = useSiteSettings();
  const aiEnabled = settings.ai_enabled !== "false";
  if (!aiEnabled && !isAdmin) return null;
  return <AiChatWidget />;
};

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  // Lets an admin temporarily see the site exactly as a logged-out visitor
  // would — shop hidden if disabled, maintenance page showing, etc. —
  // without actually logging out. Resets on logout and on a fresh page load
  // (it's a session-only preview toggle, not a persisted preference).
  const [viewAsVisitor, setViewAsVisitor] = useState(false);
  const effectiveIsAdmin = isAdmin && !viewAsVisitor;
  useEffect(() => {
    if (!isAdmin) setViewAsVisitor(false);
  }, [isAdmin]);
  const { settings: siteSettings } = useSiteSettings();
  const maintenanceMode = siteSettings.maintenance_mode === "true";
  const isPopupLoginRoute =
    typeof window !== "undefined" && window.location.pathname === "/admin-login";

  // The admin-login popup window is intentionally chrome-less (no nav bar,
  // footer, cookie banner) — it's meant to be a small standalone window, not
  // a normal page in the site.
  if (isPopupLoginRoute) {
    return (
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<RouteFallback />}>
            <AdminLogin />
          </Suspense>
        </TooltipProvider>
      </PersistQueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <TooltipProvider>
        <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LiquidGlassDefs />
          <OfflineGate />
          <AnalyticsTracker />
          <div className="min-h-screen bg-background">
            <Navigation
              onAdminAccess={setIsAdmin}
              isAdmin={effectiveIsAdmin}
              actualIsAdmin={isAdmin}
              viewAsVisitor={viewAsVisitor}
              onViewAsVisitorChange={setViewAsVisitor}
            />
            {maintenanceMode && !effectiveIsAdmin ? (
              <MaintenancePage />
            ) : (
              <Suspense fallback={<RouteFallback />}>
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<Home isAdmin={effectiveIsAdmin} />} />
                    <Route path="/teams" element={<OfficialTeams isAdmin={effectiveIsAdmin} />} />
                    <Route path="/color-selector" element={<ColorCodeSelector isAdmin={effectiveIsAdmin} />} />
                    <Route path="/sponsorships" element={<Sponsorships isAdmin={effectiveIsAdmin} />} />
                    <Route path="/bracket" element={<Bracket isAdmin={effectiveIsAdmin} />} />
                    <Route path="/voting" element={<Voting isAdmin={effectiveIsAdmin} />} />
                    <Route path="/shop" element={<ShopGate isAdmin={effectiveIsAdmin}><Shop /></ShopGate>} />
                    <Route path="/shop/:productId" element={<ShopGate isAdmin={effectiveIsAdmin}><ShopProduct /></ShopGate>} />
                    <Route path="/shipping-returns" element={<ShippingReturns />} />
                    <Route path="/staff" element={<Staff isAdmin={effectiveIsAdmin} />} />
                    <Route path="/credits" element={<Credits isAdmin={effectiveIsAdmin} />} />
                    <Route path="/faq" element={<FAQ isAdmin={effectiveIsAdmin} />} />
                    <Route path="/policy/privacy" element={<PrivacyPolicy />} />
                    <Route path="/policy/cookie" element={<CookiePolicy />} />
                    <Route path="/discord-callback" element={<DiscordCallback />} />
                    <Route path="/officials" element={<Officials />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </Suspense>
            )}
        <CookieConsent />
        <AiChatGate isAdmin={effectiveIsAdmin} />
          </div>
        </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
