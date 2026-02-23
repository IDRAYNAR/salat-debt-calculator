"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import translations from "./translations.json";

const STORAGE_KEY = "qada-tracker:lang";

export type Locale = "en" | "fr";

const DEFAULT_LOCALE: Locale = "en";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "fr") return stored;
  return DEFAULT_LOCALE;
}

type Translations = typeof translations;
type EnKeys = keyof Translations["en"];

type LanguageContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (section: EnKeys, key: string) => string;
  mounted: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", locale);
  }, [mounted, locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (section: EnKeys, key: string): string => {
      const sectionTranslations = translations[locale][section] as Record<string, string> | undefined;
      if (!sectionTranslations) return key;
      const value = sectionTranslations[key];
      return typeof value === "string" ? value : key;
    },
    [locale]
  );

  const value: LanguageContextValue = { locale, setLocale, t, mounted };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
