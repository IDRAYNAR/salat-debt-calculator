"use client";

import { useState } from "react";
import { useQadaStorage } from "./useLocalStorage";
import { calculateTotalDays } from "../lib/calculations";
import { useLanguage } from "../i18n/LanguageProvider";
import { LanguageSwitch } from "./LanguageSwitch";

export function OnboardingForm() {
  const { actions } = useQadaStorage();
  const { t, isRtl } = useLanguage();
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");
  const [days, setDays] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const yearsNum = parseInt(years, 10) || 0;
    const monthsNum = parseInt(months, 10) || 0;
    const daysNum = parseInt(days, 10) || 0;

    if (yearsNum < 0 || monthsNum < 0 || daysNum < 0) {
      setError(t("onboarding", "errorPositive"));
      return;
    }

    if (yearsNum === 0 && monthsNum === 0 && daysNum === 0) {
      setError(t("onboarding", "errorAtLeastOne"));
      return;
    }

    const totalDays = calculateTotalDays(yearsNum, monthsNum, daysNum);
    if (totalDays <= 0) {
      setError(t("onboarding", "errorTotalPositive"));
      return;
    }

    actions.start(totalDays);
  };

  return (
    <div className="sa-page flex items-center justify-center">
      <div className="sa-shell">
        <div className={`sa-topbar ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="sa-card-soft px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase sa-gold">
            {t("common", "appName")}
          </div>
          <LanguageSwitch />
        </div>

        <section className="sa-card sa-animate-in">
          <div className={`mb-7 ${isRtl ? "text-right" : "text-left"}`}>
            <h1 className="sa-heading mb-2">{t("onboarding", "title")}</h1>
            <p className="sa-subheading">{t("onboarding", "subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="years" className="sa-label">
                  {t("onboarding", "years")}
                </label>
                <input
                  id="years"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="sa-input"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="months" className="sa-label">
                  {t("onboarding", "months")}
                </label>
                <input
                  id="months"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  className="sa-input"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="days" className="sa-label">
                  {t("onboarding", "days")}
                </label>
                <input
                  id="days"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="sa-input"
                  placeholder="0"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <button type="submit" className="sa-btn-primary">
              {t("onboarding", "submit")}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
