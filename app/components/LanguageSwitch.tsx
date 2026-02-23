"use client";

import { type ChangeEvent } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage, type Locale } from "../i18n/LanguageProvider";

const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية"
};

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLanguage();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (next === "en" || next === "fr" || next === "ar") {
      setLocale(next);
    }
  };

  const ariaLabel = t("common", "languageSelectAria");

  return (
    <div className="sa-lang-select-wrap">
      <select
        className="sa-lang-select"
        aria-label={ariaLabel}
        value={locale}
        onChange={handleChange}
      >
        <option value="en">{LOCALE_LABEL.en}</option>
        <option value="fr">{LOCALE_LABEL.fr}</option>
        <option value="ar">{LOCALE_LABEL.ar}</option>
      </select>
      <ChevronDown size={15} className="sa-lang-chevron" aria-hidden="true" />
    </div>
  );
}
