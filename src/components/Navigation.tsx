import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Settings, Menu, X } from "lucide-react";
import youtubeLogo from "@/assets/youtube-logo.svg";
import tiktokLogo from "@/assets/tiktok-logo.svg";
import twitchLogo from "@/assets/twitch-logo.svg";
import discordLogo from "@/assets/discord-logo.svg";
import { useToast } from "@/hooks/use-toast";
import gticLogo from "@/assets/gtic-logo.png";

interface NavigationProps {
  onAdminAccess: (isAdmin: boolean) => void;
  isAdmin: boolean;
}

export const Navigation = ({ onAdminAccess, isAdmin }: NavigationProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Official Teams", path: "/team" },
    { name: "Color Code Selector", path: "/color-selector" },
    { name: "FAQ", path: "/faq" },
  ];

  const handleAdminLogin = () => {
    if (adminCode === "STAFF2840w") {
      onAdminAccess(true);
      setIsAdminDialogOpen(false);
      setAdminCode("");
      toast({
        title: "Admin Access Granted",
        description: "You now have access to edit content.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin code.",
        variant: "destructive",
      });
    }
  };

  const handleAdminLogout = () => {
    onAdminAccess(false);
    toast({
      title: "Logged Out",
      description: "Admin access revoked.",
    });
  };

  const isActivePage = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img src={gticLogo} alt="Gorilla Tag Intermediate COMP Logo" className="h-10 w-10" />
            <span className="text-xl font-bold hero-text">Gorilla Tag Intermediate COMP</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-link ${isActivePage(item.path) ? "active" : ""}`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Social Media Icons & Admin Button */}
          <div className="hidden md:flex items-center space-x-2">
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
            
            {/* Admin Button */}
            {isAdmin ? (
              <Button variant="outline" onClick={handleAdminLogout} className="text-secondary">
                Admin Mode
              </Button>
            ) : (
              <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="card-gradient">
                  <DialogHeader>
                    <DialogTitle>Admin Access</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Enter admin code"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    />
                    <Button onClick={handleAdminLogin} className="w-full">
                      Access Admin Panel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 animate-slide-in">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`nav-link ${isActivePage(item.path) ? "active" : ""}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
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
                
                {isAdmin ? (
                  <Button variant="outline" onClick={handleAdminLogout} className="w-full text-secondary">
                    Logout Admin
                  </Button>
                ) : (
                  <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Access
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="card-gradient">
                      <DialogHeader>
                        <DialogTitle>Admin Access</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          type="password"
                          placeholder="Enter admin code"
                          value={adminCode}
                          onChange={(e) => setAdminCode(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                        />
                        <Button onClick={handleAdminLogin} className="w-full">
                          Access Admin Panel
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};