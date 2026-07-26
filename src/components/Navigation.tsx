import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import youtubeLogo from "@/assets/youtube-logo.svg";
import tiktokLogo from "@/assets/tiktok-logo.svg";
import twitchLogo from "@/assets/twitch-logo.svg";
import discordLogo from "@/assets/discord-logo.svg";
import { useToast } from "@/hooks/use-toast";
import gticLogo from "@/assets/gtic-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface NavigationProps {
  onAdminAccess: (isAdmin: boolean) => void;
  isAdmin: boolean;
}

export const Navigation = ({ onAdminAccess, isAdmin }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

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

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: userId, _role: 'admin' });
    
    if (!error && data) {
      onAdminAccess(true);
    } else {
      onAdminAccess(false);
    }
  };

  const navItems = [
    { name: "Home", path: "/", external: false },
    { name: "Official Teams", path: "/teams", external: false },
    { name: "Bracket", path: "/bracket", external: false },
    { name: "Color Code Selector", path: "/color-selector", external: false },
    { name: "Sponsorships", path: "/sponsorships", external: false },
    { name: "Wallpapers", path: "/wallpapers", external: false },
    { name: "Appeal", path: "/appeal", external: false },
    { name: "FAQ", path: "/faq", external: false },
  ];

  const handleAdminLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await checkAdminRole(data.user.id);
        setIsAdminDialogOpen(false);
        setEmail("");
        setPassword("");
        toast({
          title: "Logged In",
          description: isAdmin ? "Admin access granted." : "Logged in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
      {/* Liquid glass floating shell */}
      <div className="relative overflow-hidden bg-background/45 backdrop-blur-2xl backdrop-saturate-150 border border-white/20 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
        {/* Top refractive highlight */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
        {/* Bottom soft glow */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />

        <div className="relative container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img src={gticLogo} alt="Gorilla Tag Elite COMP Logo" className="h-10 w-10" />
              <span className="text-xl font-bold hero-text">Gorilla Tag Elite COMP</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
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
                    className={`nav-link ${isActivePage(item.path) ? "active" : ""}`}
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>

            {/* Social Media Icons & Admin Button */}
            <div className="hidden lg:flex items-center space-x-2">
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
                href="https://www.twitch.tv/gticleague"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Button variant="ghost" size="icon">
                  <img src={twitchLogo} alt="Twitch" className="h-4 w-4" />
                </Button>
              </a>
              <a
                href="https://discord.gg/hB4V4ywqxj"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Button variant="ghost" size="icon">
                  <img src={discordLogo} alt="Discord" className="h-4 w-4" />
                </Button>
              </a>
              
              {/* Settings Menu */}
              <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-popover" align="end">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Settings</h3>
                    
                    {/* Theme Toggle */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Theme</Label>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <span className="text-sm">Dark Mode</span>
                        </div>
                        <Switch
                          checked={theme === "light"}
                          onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
                        />
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <span className="text-sm">Light Mode</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Admin Access */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Admin Access</Label>
                      {isAdmin ? (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            handleAdminLogout();
                            setIsSettingsOpen(false);
                          }} 
                          className="w-full text-secondary"
                        >
                          Logout Admin
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsAdminDialogOpen(true);
                            setIsSettingsOpen(false);
                          }}
                          className="w-full"
                        >
                          Admin Login
                        </Button>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Admin Dialog */}
              <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                <DialogContent className="glass-panel">
                  <DialogHeader>
                    <DialogTitle>Admin Login</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    />
                    <Button onClick={handleAdminLogin} className="w-full">
                      Login
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden relative"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <span className="relative block h-6 w-6">
                <Menu
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isMenuOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                  }`}
                />
                <X
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                  }`}
                />
              </span>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div
            className={`lg:hidden grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col space-y-2 pb-4">
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
                      className={`nav-link ${isActivePage(item.path) ? "active" : ""} ${isMenuOpen ? "animate-menu-item" : ""}`}
                      style={{ animationDelay: `${index * 35}ms` }}
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
                      href="https://www.twitch.tv/gticleague"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Button variant="ghost" size="icon">
                        <img src={twitchLogo} alt="Twitch" className="h-4 w-4" />
                      </Button>
                    </a>
                    <a
                      href="https://discord.gg/hB4V4ywqxj"
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
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
