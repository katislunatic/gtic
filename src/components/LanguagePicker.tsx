import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";

// Renders a country's flag as a small circle image (flagcdn.com), since
// emoji flags fall back to plain two-letter text on Windows.
const FlagCircle = ({ country, alt }: { country: string; alt: string }) => (
  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full overflow-hidden bg-muted/40 ring-1 ring-border">
    <img
      src={`https://flagcdn.com/w40/${country}.png`}
      alt={alt}
      className="h-full w-full object-cover"
    />
  </span>
);

// Language picker shown in the Settings popover. Collapsed by default as a
// button showing the current language; clicking it opens a search box plus
// a scrollable list of the site's supported languages, each with a flag.
// Selecting one persists via i18next-browser-languagedetector (localStorage).
export const LanguagePicker = () => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

  const filtered = SUPPORTED_LANGUAGES.filter((lang) =>
    lang.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{t("settings.language")}</Label>

      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full justify-between font-normal"
      >
        <span className="flex items-center gap-2">
          <FlagCircle country={current.flagCountry} alt={current.label} />
          {current.label}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="space-y-2 animate-fade-in">
          <Input
            placeholder={t("settings.searchLanguage")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="h-9"
          />
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
            {filtered.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => selectLanguage(lang.code)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${
                    isActive ? "bg-muted/30" : ""
                  }`}
                >
                  <FlagCircle country={lang.flagCountry} alt={lang.label} />
                  <span className="flex-1">{lang.label}</span>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
