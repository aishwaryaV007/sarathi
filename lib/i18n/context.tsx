"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

import en from "./translations/en.json";
import hi from "./translations/hi.json";
import te from "./translations/te.json";

export type Locale = "en" | "hi" | "te";

const translations: Record<Locale, Record<string, string>> = { en, hi, te };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  hi: "हिं",
  te: "తెలుగు",
};

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Load saved locale from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sarathi_locale") as Locale | null;
    if (saved && translations[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("sarathi_locale", l);
    // Update the html lang attribute
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] ?? translations.en[key] ?? key;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
