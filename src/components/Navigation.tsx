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
    { name: "Color Code Selector", path: "/color-selector", external: false },
    { name: "Sponsorships", path: "/sponsorships", external: false },
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
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
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
              href="https://www.youtube.com/@gticleague"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Button variant="ghost" size="icon">
                <img src={youtubeLogo} alt="YouTube" className="h-4 w-4" />
              </Button>
            </a>
            <a
              href="https://www.tiktok.com/@gtic_league?_t=ZT-8xSOoLf3VDJ&_r=1"
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
              <DialogContent className="card-gradient">
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
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4 animate-slide-in">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) =>
                item.external ? (
                  <a
                    key={item.name}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`nav-link`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`nav-link ${isActivePage(item.path) ? "active" : ""}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              )}
              <div className="pt-2 border-t border-border">
                {/* Social Media Links */}
                <div className="flex justify-center space-x-2 mb-4">
                  <a
                    href="https://www.youtube.com/@gticleague"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Button variant="ghost" size="icon">
                      <img src={youtubeLogo} alt="YouTube" className="h-4 w-4" />
                    </Button>
                  </a>
                  <a
                    href="https://www.tiktok.com/@gtic_league?_t=ZT-8xSOoLf3VDJ&_r=1"
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
        )}
      </div>
    </nav>
  );
};