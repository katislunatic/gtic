import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import pt from "./locales/pt.json";
import de from "./locales/de.json";

// The 5 languages available in the site's language picker.
// Add a new one by: creating locales/<code>.json (copy en.json and translate
// the values), importing it above, and adding it to both `resources` and
// `SUPPORTED_LANGUAGES` below.
// `flagCountry` is a 2-letter ISO country code used to fetch a real flag
// image (via flagcdn.com) — emoji flags don't render as images on Windows,
// they fall back to plain two-letter text, so we use actual image icons instead.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flagCountry: "us" },
  { code: "es", label: "Español", flagCountry: "es" },
  { code: "fr", label: "Français", flagCountry: "fr" },
  { code: "pt", label: "Português", flagCountry: "br" },
  { code: "de", label: "Deutsch", flagCountry: "de" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      pt: { translation: pt },
      de: { translation: de },
    },
    lng: "en",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: {
      escapeValue: false, // React already escapes output
    },
    detection: {
      // Only ever pick a language from the user's own explicit choice in the
      // language picker (persisted here). We deliberately do NOT auto-detect
      // from the browser/OS language — that was landing on the wrong
      // language for some visitors. Everyone starts on English by default.
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: "gtec_language",
    },
  });

export default i18n;
