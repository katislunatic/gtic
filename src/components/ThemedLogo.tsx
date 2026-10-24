import { useState } from "react";
import { DEFAULT_LOGO, SITE_THEMES, useActiveSiteTheme } from "@/lib/siteThemes";

// The site logo, swapped for the active seasonal theme's version (files live
// in /public/themes). If a theme's logo file is missing or fails to load, it
// quietly falls back to the normal logo instead of showing a broken image.
export const ThemedLogo = ({ className, alt = "Gorilla Tag Elite COMP Logo" }: { className?: string; alt?: string }) => {
  const themeId = useActiveSiteTheme();
  const wanted = SITE_THEMES[themeId].logo;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = failedSrc === wanted ? DEFAULT_LOGO : wanted;

  return <img src={src} alt={alt} className={className} onError={() => setFailedSrc(wanted)} />;
};
