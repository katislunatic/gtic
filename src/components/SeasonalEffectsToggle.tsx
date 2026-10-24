import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SITE_THEMES, useActiveSiteTheme } from "@/lib/siteThemes";
import { useThemeEffects } from "@/hooks/use-theme-effects";

// Settings row that lets each visitor turn the seasonal effect (falling snow,
// etc.) on or off for themselves. Only shows up while a theme with an effect
// is active, so it stays out of the way the rest of the year.
export const SeasonalEffectsToggle = () => {
  const themeId = useActiveSiteTheme();
  const { enabled, setEnabled } = useThemeEffects();
  const theme = SITE_THEMES[themeId];
  if (theme.effect === "none") return null;

  return (
    <>
      <div className="space-y-3 rounded-lg bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Seasonal Effects</Label>
            <p className="text-xs text-muted-foreground">{theme.effectDescription}</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>
      <Separator />
    </>
  );
};
