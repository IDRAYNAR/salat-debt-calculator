"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import translations from "./translations.json";

const STORAGE_KEY = "qada-tracker:lang";
const MISSING_TRANSLATION_WARNINGS = new Set<string>();

export type Locale = "en" | "fr" | "ar";

const DEFAULT_LOCALE: Locale = "en";

type Direction = "ltr" | "rtl";

type Translations = typeof translations;
type BaseTranslations = Translations["en"];
type SectionKey = keyof BaseTranslations;
type KeyForSection<S extends SectionKey> = keyof BaseTranslations[S] & string;

function validateTranslationShape() {
  const source = translations.en as Record<string, Record<string, string>>;
  const targetBundles = translations as Record<string, Record<string, Record<string, string>>>;
  const issues: string[] = [];

  for (const locale of ["fr", "ar"] as const) {
    const bundle = targetBundles[locale];
    if (!bundle) {
      issues.push(`[${locale}] translation bundle is missing.`);
      continue;
    }

    for (const section of Object.keys(source)) {
      const sourceSection = source[section];
      const targetSection = bundle[section];
      if (!targetSection) {
        issues.push(`[${locale}] missing section "${section}".`);
        continue;
      }

      for (const key of Object.keys(sourceSection)) {
        if (!(key in targetSection) || typeof targetSection[key] !== "string") {
          issues.push(`[${locale}] missing key "${section}.${key}".`);
        }
      }
    }
  }

  if (issues.length > 0) {
    console.error("Translation validation issues:\n" + issues.join("\n"));
  }
}

if (process.env.NODE_ENV !== "production") {
  validateTranslationShape();
}

function getDirection(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr" || stored === "ar") return stored;
  } catch (error) {
    console.error("Failed to read stored locale.", error);
  }

  return DEFAULT_LOCALE;
}

type LanguageContextValue = {
  locale: Locale;
  dir: Direction;
  isRtl: boolean;
  setLocale: (next: Locale) => void;
  t: <S extends SectionKey>(section: S, key: KeyForSection<S>) => string;
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

  const dir = getDirection(locale);
  const isRtl = dir === "rtl";

  useEffect(() => {
    if (!mounted) return;

    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", dir);
  }, [mounted, locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    const normalized = next === "ar" || next === "fr" ? next : DEFAULT_LOCALE;
    setLocaleState(normalized);
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch (error) {
      console.error("Failed to persist locale.", error);
    }
  }, []);

  const t = useCallback(
    <S extends SectionKey>(section: S, key: KeyForSection<S>): string => {
      const sectionName = section as string;
      const keyName = key as string;
      const localeBundle = translations[locale] as Record<string, Record<string, string> | undefined>;
      const englishBundle = translations.en as Record<string, Record<string, string> | undefined>;

      const value = localeBundle[sectionName]?.[keyName];
      if (typeof value === "string") return value;

      const fallbackValue = englishBundle[sectionName]?.[keyName];

      if (process.env.NODE_ENV !== "production") {
        const warnKey = `${locale}:${sectionName}.${keyName}`;
        if (locale !== "en" && !MISSING_TRANSLATION_WARNINGS.has(warnKey)) {
          MISSING_TRANSLATION_WARNINGS.add(warnKey);
          console.warn(`Missing translation for "${warnKey}", fallback applied.`);
        }
      }

      return typeof fallbackValue === "string" ? fallbackValue : keyName;
    },
    [locale]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, dir, isRtl, setLocale, t, mounted }),
    [locale, dir, isRtl, setLocale, t, mounted]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
