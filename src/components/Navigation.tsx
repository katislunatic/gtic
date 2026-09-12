import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Menu, X, Sun, Moon, ShoppingCart, Globe, Eye, Users, BarChart3, ShieldCheck, ChevronRight, ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { LanguagePicker } from "@/components/LanguagePicker";
import youtubeLogo from "@/assets/youtube-logo.svg";
import tiktokLogo from "@/assets/tiktok-logo.svg";
import discordLogo from "@/assets/discord-logo.svg";
import { useToast } from "@/hooks/use-toast";
import { useLiquidGlass } from "@/hooks/use-liquid-glass";
import { useCart } from "@/hooks/use-cart";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useVotingCampaigns } from "@/hooks/use-voting";
import { CartDrawer } from "@/components/CartDrawer";
import { AdminPanel } from "@/components/AdminPanel";
import { GlobalSearch } from "@/components/GlobalSearch";
import { DiscordAccountSection } from "@/components/DiscordAccountSection";
import gticLogo from "@/assets/gtic-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface NavigationProps {
  onAdminAccess: (isAdmin: boolean) => void;
  isAdmin: boolean;
  actualIsAdmin?: boolean;
  viewAsVisitor?: boolean;
  onViewAsVisitorChange?: (value: boolean) => void;
}

export const Navigation = ({
  onAdminAccess,
  isAdmin,
  actualIsAdmin = isAdmin,
  viewAsVisitor = false,
  onViewAsVisitorChange,
}: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminLogoutDialogOpen, setIsAdminLogoutDialogOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminPanelSection, setAdminPanelSection] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // Mobile-only: which content the slide-down mobile menu panel currently
  // shows. Tapping Settings collapses the panel, swaps this, then re-expands
  // it with the Settings content in place — rather than opening a separate
  // floating popover (which is what the desktop Settings button uses).
  const [mobileMenuView, setMobileMenuView] = useState<"nav" | "settings">("nav");
  const { count: cartCount } = useCart();
  const { settings, saveSettings } = useSiteSettings();
  const shopEnabled = settings.shop_enabled !== "false";
  const aiEnabled = settings.ai_enabled !== "false";
  const maintenanceMode = settings.maintenance_mode === "true";
  // While maintenance mode is on for a non-admin, the nav bar strips down to
  // just the logo — no tabs, socials, search, cart, or settings. The secret
  // "admin" typing/tap trigger keeps working underneath regardless, since
  // it's a document-level listener, not tied to what's rendered.
  const restricted = maintenanceMode && !isAdmin;
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { enabled: liquidGlassEnabled, setEnabled: setLiquidGlassEnabled } = useLiquidGlass();
  const lastToggleOrigin = useRef<{ x: number; y: number } | null>(null);
  const typedBuffer = useRef("");
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        onAdminAccess(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Secret admin trigger: type "admin" anywhere on the page (not while
  // focused in a text field). Opens the login dialog if logged out, opens a
  // logout confirmation if already admin — typing "admin" never logs you out
  // by itself. Keeps this out of the Settings panel entirely.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTyping || e.key.length !== 1) return;

      typedBuffer.current = (typedBuffer.current + e.key.toLowerCase()).slice(-5);
      if (typedBuffer.current === "admin") {
        typedBuffer.current = "";
        // Stop this same keystroke from also being typed into whatever input
        // ends up focused when the dialog opens right after.
        e.preventDefault();
        if (actualIsAdmin) {
          setIsAdminLogoutDialogOpen(true);
        } else {
          openAdminLoginPopup();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actualIsAdmin]);

  // Opens the admin login form in its own real browser window (window.open),
  // rather than an in-page dialog. If the main site is being screen-shared as
  // a single window/tab (not the whole screen), this separate popup window
  // won't appear in that capture. Sharing the entire screen would still show
  // it, since it's just another window on the desktop at that point.
  // On mobile, most browsers don't support separate floating windows, so
  // window.open falls back to opening /admin-login as a new tab instead.
  const openAdminLoginPopup = () => {
    const width = 400;
    const height = 480;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      "/admin-login",
      "gtec-admin-login",
      `width=${width},height=${height},left=${left},top=${top},noopener=no`
    );
  };

  // Mobile equivalent: tap the logo 5 times within 2 seconds to trigger the same way.
  const handleLogoTap = () => {
    logoTapCount.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      if (actualIsAdmin) {
        setIsAdminLogoutDialogOpen(true);
      } else {
        openAdminLoginPopup();
      }
      return;
    }
    logoTapTimer.current = setTimeout(() => {
      logoTapCount.current = 0;
    }, 2000);
  };

  // Mobile Settings transition: collapse the menu panel, swap its content
  // to Settings, then re-expand — matching the collapse/expand animation
  // already used for opening/closing the mobile menu itself.
  const MOBILE_MENU_TRANSITION_MS = 500;

  const openMobileSettings = () => {
    setIsMenuOpen(false);
    setTimeout(() => {
      setMobileMenuView("settings");
      setIsMenuOpen(true);
    }, MOBILE_MENU_TRANSITION_MS);
  };

  const closeMobileSettings = () => {
    setIsMenuOpen(false);
    setTimeout(() => {
      setMobileMenuView("nav");
      setIsMenuOpen(true);
    }, MOBILE_MENU_TRANSITION_MS);
  };

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: userId, _role: 'admin' });
    
    if (!error && data) {
      onAdminAccess(true);
    } else {
      onAdminAccess(false);
    }
  };

  // Mirrors the category ids used inside AdminPanel's accordion — hovering
  // the Admin Panel trigger shows these like a shop mega-menu, and clicking
  // one opens the panel with that category already expanded.
  const adminCategories = [
    { id: "site-visibility", label: "Site Visibility", icon: Globe },
    { id: "preview", label: "Preview", icon: Eye },
    { id: "staff", label: "Staff", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "admins", label: "Admin Access", icon: ShieldCheck },
  ];

  const openAdminPanelSection = (sectionId: string) => {
    setIsSettingsOpen(false);
    setAdminPanelSection(sectionId);
    setIsAdminPanelOpen(true);
  };

  // Only shows the Voting tab while at least one campaign is actually
  // active — admins still see it via the isAdmin check so they can manage
  // votes/set one up before it goes live.
  const { campaigns: activeVotingCampaigns } = useVotingCampaigns({ onlyActive: true });
  const hasActiveVote = activeVotingCampaigns.length > 0;

  const navItems = [
    { name: t("nav.home"), path: "/", external: false },
    { name: t("nav.teams"), path: "/teams", external: false },
    { name: t("nav.bracket"), path: "/bracket", external: false },
    ...(shopEnabled || isAdmin ? [{ name: t("nav.shop"), path: "/shop", external: false }] : []),
    { name: t("nav.staff"), path: "/staff", external: false },
    ...(hasActiveVote || isAdmin ? [{ name: t("nav.voting"), path: "/voting", external: false }] : []),
    { name: t("nav.colorSelector"), path: "/color-selector", external: false },
    { name: t("nav.sponsorships"), path: "/sponsorships", external: false },
    { name: t("nav.faq"), path: "/faq", external: false },
  ];

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    onAdminAccess(false);
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out.",
    });
  };

  const isActivePage = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-3 left-3 right-3 z-50 max-w-7xl mx-auto">
      <div className="glass-panel bg-muted/70 border-border">
        <div className="relative container mx-auto px-3 sm:px-4">
          <div className={`flex items-center gap-2 h-14 ${restricted ? "justify-center" : "justify-between"}`}>
            {/* Logo */}
            <Link to="/" onClick={handleLogoTap} className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
              <img src={gticLogo} alt="Gorilla Tag Elite COMP Logo" className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
              <span className="hidden sm:inline xl:hidden 2xl:inline text-base sm:text-lg font-bold hero-text truncate">
                Gorilla Tag Elite COMP
              </span>
              <span className="sm:hidden xl:inline 2xl:hidden text-base font-bold hero-text">GTEC</span>
            </Link>

            {/* Desktop Navigation */}
            {!restricted && (
              <div className="hidden xl:flex items-center gap-0.5 text-sm">
                {navItems.map((item) =>
                  item.external ? (
                    <a
                      key={item.name}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`nav-link`}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`nav-link ${isActivePage(item.path) ? "active" : ""} ${
                        item.path === "/voting" ? "animate-glow font-semibold" : ""
                      }`}
                      style={
                        item.path === "/voting"
                          ? {
                              backgroundImage: "linear-gradient(135deg, hsl(48 95% 60%), hsl(32 95% 50%))",
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              color: "transparent",
                            }
                          : undefined
                      }
                    >
                      {item.name}
                    </Link>
                  )
                )}
              </div>
            )}

            {/* Social Media Icons & Admin Button */}
            {!restricted && (
            <div className="hidden xl:flex items-center space-x-2">
              {/* Social Media Links */}
              <a
                href="https://www.youtube.com/@GTECLeague"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Button variant="ghost" size="icon">
                  <img src={youtubeLogo} alt="YouTube" className="h-4 w-4" />
                </Button>
              </a>
              <a
                href="https://www.tiktok.com/@gtec_league"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Button variant="ghost" size="icon">
                  <img src={tiktokLogo} alt="TikTok" className="h-4 w-4" />
                </Button>
              </a>
              <a
                href="https://discord.gg/gtecleague"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Button variant="ghost" size="icon">
                  <img src={discordLogo} alt="Discord" className="h-4 w-4" />
                </Button>
              </a>

              {/* Search */}
              <GlobalSearch shopEnabled={shopEnabled || isAdmin} />

              {/* Cart */}
              {(shopEnabled || isAdmin) && (
                <Button variant="ghost" size="icon" className="relative" onClick={() => setIsCartOpen(true)} aria-label="Open cart">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      {cartCount}
                    </span>
                  )}
                </Button>
              )}
              
              {/* Settings Menu */}
              <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="settings-popover-content w-80 bg-popover p-5 rounded-xl shadow-lg overflow-hidden" align="end">
                  <div className="space-y-4 animate-menu-in">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <Settings className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-lg">{t("settings.title")}</h3>
                    </div>
                    
                    {/* Theme Toggle */}
                    <div className="space-y-3 rounded-lg bg-muted/30 p-3">
                      <Label className="text-sm font-medium">{t("settings.theme")}</Label>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon
                            className={`h-4 w-4 transition-all duration-500 ${
                              theme === "light"
                                ? "opacity-40 -rotate-90 scale-75"
                                : "opacity-100 rotate-0 scale-100 text-primary"
                            }`}
                          />
                          <span className="text-sm">{t("settings.darkMode")}</span>
                        </div>
                        <Switch
                          checked={theme === "light"}
                          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            lastToggleOrigin.current = {
                              x: rect.left + rect.width / 2,
                              y: rect.top + rect.height / 2,
                            };
                          }}
                          onCheckedChange={(checked) => {
                            const root = document.documentElement;
                            const nextTheme = checked ? "light" : "dark";

                            // Use the captured click position so the wipe expands from the toggle
                            const origin = lastToggleOrigin.current ?? {
                              x: window.innerWidth / 2,
                              y: window.innerHeight / 2,
                            };
                            const { x, y } = origin;
                            const maxRadius = Math.hypot(
                              Math.max(x, window.innerWidth - x),
                              Math.max(y, window.innerHeight - y)
                            );
                            root.style.setProperty("--theme-toggle-x", `${x}px`);
                            root.style.setProperty("--theme-toggle-y", `${y}px`);
                            root.style.setProperty("--theme-toggle-r", `${maxRadius}px`);

                            const supportsViewTransitions =
                              typeof document !== "undefined" &&
                              // @ts-ignore - not yet in all TS DOM libs
                              typeof document.startViewTransition === "function" &&
                              !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

                            if (supportsViewTransitions) {
                              root.classList.add("theme-wiping");
                              // @ts-ignore
                              const transition = document.startViewTransition(() => {
                                setTheme(nextTheme);
                              });
                              transition.finished.finally(() => {
                                root.classList.remove("theme-wiping");
                              });
                            } else {
                              // Fallback: crossfade for browsers without View Transitions support
                              root.classList.add("theme-animating");
                              window.setTimeout(() => root.classList.remove("theme-animating"), 550);
                              setTheme(nextTheme);
                            }
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Sun
                            className={`h-4 w-4 transition-all duration-500 ${
                              theme === "light"
                                ? "opacity-100 rotate-0 scale-100 text-primary"
                                : "opacity-40 rotate-90 scale-75"
                            }`}
                          />
                          <span className="text-sm">{t("settings.lightMode")}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Language Picker */}
                    <div className="rounded-lg bg-muted/30 p-3">
                      <LanguagePicker />
                    </div>

                    <Separator />

                    {/* Liquid Glass Mode */}
                    <div className="space-y-3 rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">{t("settings.liquidGlass")}</Label>
                          <p className="text-xs text-muted-foreground">
                            {t("settings.liquidGlassDesc")}
                          </p>
                        </div>
                        <Switch
                          checked={liquidGlassEnabled}
                          onCheckedChange={setLiquidGlassEnabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Admin Panel — opens a small draggable floating panel
                        (not another popup window) that houses site-wide admin
                        toggles like Shop Visibility, so future toggles land
                        there instead of piling up in this Settings menu. */}
                    {actualIsAdmin && (
                      <>
                        <div className="space-y-3">
                          {/* Hover to preview the panel's categories — like a
                              shop mega-menu — without clicking. Clicking a
                              category jumps straight into the panel with
                              that section already expanded; clicking the
                              button itself opens the panel as-is. */}
                          <HoverCard openDelay={150} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsSettingsOpen(false);
                                  setAdminPanelSection(undefined);
                                  setIsAdminPanelOpen(true);
                                }}
                                className="w-full"
                              >
                                Admin Panel
                              </Button>
                            </HoverCardTrigger>
                            <HoverCardContent align="start" className="w-56 p-1.5">
                              <div className="space-y-0.5">
                                {adminCategories.map((category) => (
                                  <button
                                    key={category.id}
                                    onClick={() => openAdminPanelSection(category.id)}
                                    className="w-full flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                                  >
                                    <span className="flex items-center gap-2">
                                      <category.icon className="h-3.5 w-3.5" />
                                      {category.label}
                                    </span>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  </button>
                                ))}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Discord account — the normal way in. Signing in with
                        an allow-listed Discord account grants the admin view.
                        Its exit icon logs out of the underlying session
                        entirely, which is also what ends the admin view. */}
                    <Separator />
                    <DiscordAccountSection />
                  </div>

                </PopoverContent>
              </Popover>

              {/* Admin Logout Confirmation — a visually distinct panel from
                  login, so typing "admin" while logged in asks first rather
                  than logging out instantly. Login itself now opens a separate
                  popup window (see openAdminLoginPopup) instead of a dialog here. */}
              <AlertDialog open={isAdminLogoutDialogOpen} onOpenChange={setIsAdminLogoutDialogOpen}>
                <AlertDialogContent className="glass-panel">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log out of admin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll need to log in again to make further changes as admin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        handleAdminLogout();
                        setIsAdminLogoutDialogOpen(false);
                      }}
                    >
                      Log Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            )}

            {/* Mobile Menu Button */}
            <div className="xl:hidden flex items-center gap-1">
              {!restricted && <GlobalSearch shopEnabled={shopEnabled || isAdmin} />}
              {!restricted && (shopEnabled || isAdmin) && (
                <Button variant="ghost" size="icon" className="relative" onClick={() => setIsCartOpen(true)} aria-label="Open cart">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      {cartCount}
                    </span>
                  )}
                </Button>
              )}
            <Button
              variant="ghost"
              size="icon"
              className={`relative ${restricted ? "hidden" : ""}`}
              onClick={() => {
                setIsMenuOpen((prev) => {
                  if (prev) {
                    // Closing: reset back to the nav list so the next time
                    // the menu opens, it doesn't jump straight to Settings.
                    setTimeout(() => setMobileMenuView("nav"), MOBILE_MENU_TRANSITION_MS);
                  }
                  return !prev;
                });
              }}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <span className="relative block h-4 w-4">
                <Menu
                  className={`absolute inset-0 h-4 w-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isMenuOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                  }`}
                />
                <X
                  className={`absolute inset-0 h-4 w-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                  }`}
                />
              </span>
            </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {!restricted && (
          <div
            className={`xl:hidden grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              {mobileMenuView === "nav" ? (
              <div className="flex flex-col space-y-2 pb-4 max-h-[70vh] overflow-y-auto">
                {navItems.map((item, index) =>
                  item.external ? (
                    <a
                      key={item.name}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-link"
                      style={{ animationDelay: `${index * 35}ms` }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`nav-link ${isActivePage(item.path) ? "active" : ""} ${isMenuOpen ? "animate-menu-item" : ""} ${
                        item.path === "/voting" ? "animate-glow font-semibold" : ""
                      }`}
                      style={{
                        animationDelay: `${index * 35}ms`,
                        ...(item.path === "/voting"
                          ? {
                              backgroundImage: "linear-gradient(135deg, hsl(48 95% 60%), hsl(32 95% 50%))",
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              color: "transparent",
                            }
                          : {}),
                      }}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )
                )}
                <div className="pt-2 border-t border-border/50">
                  {/* Social Media Links */}
                  <div className="flex justify-center space-x-2 mb-4">
                    <a
                      href="https://www.youtube.com/@GTECLeague"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Button variant="ghost" size="icon">
                        <img src={youtubeLogo} alt="YouTube" className="h-4 w-4" />
                      </Button>
                    </a>
                    <a
                      href="https://www.tiktok.com/@gtec_league"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Button variant="ghost" size="icon">
                        <img src={tiktokLogo} alt="TikTok" className="h-4 w-4" />
                      </Button>
                    </a>
                    <a
                      href="https://discord.gg/gtecleague"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Button variant="ghost" size="icon">
                        <img src={discordLogo} alt="Discord" className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={openMobileSettings}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
              ) : (
              <div className="flex flex-col space-y-5 pb-4 max-h-[70vh] overflow-y-auto">
                <button
                  type="button"
                  onClick={closeMobileSettings}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <h3 className="font-semibold text-lg">{t("settings.title")}</h3>

                {/* Theme Toggle */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t("settings.theme")}</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon
                        className={`h-4 w-4 transition-all duration-500 ${
                          theme === "light"
                            ? "opacity-40 -rotate-90 scale-75"
                            : "opacity-100 rotate-0 scale-100 text-primary"
                        }`}
                      />
                      <span className="text-sm">{t("settings.darkMode")}</span>
                    </div>
                    <Switch
                      checked={theme === "light"}
                      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        lastToggleOrigin.current = {
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2,
                        };
                      }}
                      onCheckedChange={(checked) => {
                        const root = document.documentElement;
                        const nextTheme = checked ? "light" : "dark";
                        const origin = lastToggleOrigin.current ?? {
                          x: window.innerWidth / 2,
                          y: window.innerHeight / 2,
                        };
                        const { x, y } = origin;
                        const maxRadius = Math.hypot(
                          Math.max(x, window.innerWidth - x),
                          Math.max(y, window.innerHeight - y)
                        );
                        root.style.setProperty("--theme-toggle-x", `${x}px`);
                        root.style.setProperty("--theme-toggle-y", `${y}px`);
                        root.style.setProperty("--theme-toggle-r", `${maxRadius}px`);

                        const supportsViewTransitions =
                          typeof document !== "undefined" &&
                          // @ts-ignore
                          typeof document.startViewTransition === "function" &&
                          !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

                        if (supportsViewTransitions) {
                          root.classList.add("theme-wiping");
                          // @ts-ignore
                          const transition = document.startViewTransition(() => {
                            setTheme(nextTheme);
                          });
                          transition.finished.finally(() => {
                            root.classList.remove("theme-wiping");
                          });
                        } else {
                          root.classList.add("theme-animating");
                          window.setTimeout(() => root.classList.remove("theme-animating"), 550);
                          setTheme(nextTheme);
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Sun
                        className={`h-4 w-4 transition-all duration-500 ${
                          theme === "light"
                            ? "opacity-100 rotate-0 scale-100 text-primary"
                            : "opacity-40 rotate-90 scale-75"
                        }`}
                      />
                      <span className="text-sm">{t("settings.lightMode")}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <LanguagePicker />

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t("settings.liquidGlass")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.liquidGlassDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={liquidGlassEnabled}
                      onCheckedChange={setLiquidGlassEnabled}
                    />
                  </div>
                </div>

                {actualIsAdmin && (
                  <>
                    <Separator />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setMobileMenuView("nav");
                        setAdminPanelSection(undefined);
                        setIsAdminPanelOpen(true);
                      }}
                      className="w-full"
                    >
                      Admin Panel
                    </Button>
                  </>
                )}
                <Separator />
                <DiscordAccountSection />
              </div>

              )}
            </div>
          </div>
          )}
        </div>
      </div>
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
      <AdminPanel
        open={isAdminPanelOpen && actualIsAdmin}
        onClose={() => setIsAdminPanelOpen(false)}
        initialSection={adminPanelSection}
        shopEnabled={shopEnabled}
        onShopEnabledChange={(checked) => saveSettings({ shop_enabled: checked ? "true" : "false" })}
        aiEnabled={aiEnabled}
        onAiEnabledChange={(checked) => saveSettings({ ai_enabled: checked ? "true" : "false" })}
        maintenanceMode={settings.maintenance_mode === "true"}
        onMaintenanceModeChange={(checked) => saveSettings({ maintenance_mode: checked ? "true" : "false" })}
        viewAsVisitor={viewAsVisitor}
        onViewAsVisitorChange={(checked) => onViewAsVisitorChange?.(checked)}
      />

      {/* Persistent "return to admin" banner — shown unconditionally whenever
          an admin is previewing the site as a visitor, regardless of what the
          rest of the nav looks like in that mode (including during Maintenance
          Mode, where everything else in the nav bar is stripped away). This is
          the guaranteed way back, since the normal Admin Panel entry points
          are intentionally hidden from a real visitor's view. */}
      {actualIsAdmin && viewAsVisitor && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm shadow-xl">
          <span>Viewing as a visitor</span>
          <Button
            size="sm"
            variant="secondary"
            className="h-7"
            onClick={() => onViewAsVisitorChange?.(false)}
          >
            Return to Admin
          </Button>
        </div>
      )}
    </nav>
  );
};
