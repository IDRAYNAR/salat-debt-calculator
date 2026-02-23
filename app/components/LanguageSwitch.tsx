"use client";

import { useLanguage } from "../i18n/LanguageProvider";

export function LanguageSwitch() {
  const { locale, setLocale } = useLanguage();

  const toggle = () => {
    setLocale(locale === "en" ? "fr" : "en");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-400 hover:text-emerald-500 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-600"
      aria-label={locale === "en" ? "Switch to French" : "Passer en anglais"}
      title={locale === "en" ? "French" : "English"}
    >
      {locale === "en" ? "FR" : "EN"}
    </button>
  );
}
