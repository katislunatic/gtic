import { Link } from "react-router-dom";
import youtubeLogo from "@/assets/youtube-logo.svg";
import tiktokLogo from "@/assets/tiktok-logo.svg";
import discordLogo from "@/assets/discord-logo.svg";
import gticLogo from "@/assets/gtic-logo.png";

const siteLinks = [
  { name: "Home", path: "/" },
  { name: "Teams", path: "/teams" },
  { name: "Bracket", path: "/bracket" },
  { name: "Shop", path: "/shop" },
  { name: "Staff", path: "/staff" },
  { name: "Sponsorships", path: "/sponsorships" },
];

const moreLinks = [
  { name: "Color Code Selector", path: "/color-selector" },
  { name: "FAQ", path: "/faq" },
  { name: "Shipping & Returns", path: "/shipping-returns" },
  { name: "Credits", path: "/credits" },
  { name: "Privacy Policy", path: "/policy/privacy" },
  { name: "Cookie Policy", path: "/policy/cookie" },
];

const socials = [
  { name: "YouTube", href: "https://www.youtube.com/@GTECLeague", icon: youtubeLogo },
  { name: "TikTok", href: "https://www.tiktok.com/@gtec_league", icon: tiktokLogo },
  { name: "Discord", href: "https://discord.gg/gtecleague", icon: discordLogo },
];

export const Footer = () => {
  return (
    <footer className="py-8 mt-16 px-3">
      <div className="glass-panel container mx-auto px-6 py-10 sm:px-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand + socials */}
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 w-fit hover:opacity-80 transition-opacity">
              <img src={gticLogo} alt="Gorilla Tag Elite COMP Logo" className="h-8 w-8" />
              <span className="font-bold hero-text text-sm">Gorilla Tag Elite COMP</span>
            </Link>
            <p className="text-xs text-muted-foreground mb-4 max-w-[220px]">
              Gorilla Tag Elite COMP — the hub for competitive Gorilla Tag.
            </p>
            <div className="flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-primary"
                >
                  <img src={s.icon} alt="" className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Site links */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Site</h3>
            <ul className="space-y-2">
              {siteLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More links */}
          <div>
            <h3 className="text-sm font-semibold mb-3">More</h3>
            <ul className="space-y-2">
              {moreLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Community</h3>
            <ul className="space-y-2">
              {socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/50 pt-6 text-center">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            Gorilla Tag Elite COMP is in no way affiliated with Another Axiom, LLC, nor should it be considered a company endorsed by Another Axiom, LLC.
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-3">
            &copy; {new Date().getFullYear()} Gorilla Tag Elite COMP. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
