import { Card, CardContent } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import gticLogo from "@/assets/gtic-logo.png";
import youtubeLogo from "@/assets/youtube-logo.svg";
import tiktokLogo from "@/assets/tiktok-logo.svg";
import discordLogo from "@/assets/discord-logo.svg";

// Shown to regular visitors for every route while Maintenance Mode is on
// (see AdminPanel). Admins bypass this entirely and see the real site
// underneath, so they can keep working while it's up.
export const MaintenancePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-8">
      <Card className="glass-panel max-w-md w-full text-center animate-fade-in">
        <CardContent className="p-8 space-y-4">
          <img src={gticLogo} alt="Gorilla Tag Elite COMP Logo" className="h-20 w-20 mx-auto animate-float" />
          <Wrench className="h-8 w-8 mx-auto text-primary" />
          <h1 className="text-2xl font-bold hero-text">We'll be right back</h1>
          <p className="text-muted-foreground">
            GTEC is currently down for maintenance. Check back soon, or join our Discord for updates.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <a
              href="https://discord.gg/gtecleague"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <img src={discordLogo} alt="Discord" className="h-6 w-6" />
            </a>
            <a
              href="https://www.youtube.com/@GTECLeague"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <img src={youtubeLogo} alt="YouTube" className="h-6 w-6" />
            </a>
            <a
              href="https://www.tiktok.com/@gtec_league"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <img src={tiktokLogo} alt="TikTok" className="h-6 w-6" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
