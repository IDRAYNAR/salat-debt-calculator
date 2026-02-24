"use client";

import { useMemo, useState } from "react";
import { useQadaStorage } from "./useLocalStorage";
import { calculateTotalDays, formatNumber } from "../lib/calculations";
import { useLanguage } from "../i18n/LanguageProvider";
import { LanguageSwitch } from "./LanguageSwitch";

export function OnboardingForm() {
  const { actions } = useQadaStorage();
  const { t, isRtl, locale } = useLanguage();
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");
  const [days, setDays] = useState("");
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    const parseValue = (raw: string) => {
      const parsed = parseInt(raw, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const yearsNum = parseValue(years);
    const monthsNum = parseValue(months);
    const daysNum = parseValue(days);
    const hasNegative = yearsNum < 0 || monthsNum < 0 || daysNum < 0;
    const hasAtLeastOne = yearsNum > 0 || monthsNum > 0 || daysNum > 0;
    const estimatedDays = !hasNegative && hasAtLeastOne ? calculateTotalDays(yearsNum, monthsNum, daysNum) : 0;
    const isValid = !hasNegative && hasAtLeastOne && estimatedDays > 0;

    return {
      yearsNum,
      monthsNum,
      daysNum,
      hasNegative,
      hasAtLeastOne,
      estimatedDays,
      estimatedPrayers: estimatedDays * 5,
      isValid
    };
  }, [days, months, years]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (preview.hasNegative) {
      setError(t("onboarding", "errorPositive"));
      return;
    }

    if (!preview.hasAtLeastOne) {
      setError(t("onboarding", "errorAtLeastOne"));
      return;
    }

    if (preview.estimatedDays <= 0) {
      setError(t("onboarding", "errorTotalPositive"));
      return;
    }

    actions.start(preview.estimatedDays);
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

            <div className={`sa-card-soft border border-dashed ${isRtl ? "text-right" : "text-left"}`}>
              <div className="mb-3 text-sm font-semibold sa-gold">{t("onboarding", "previewTitle")}</div>

              {preview.isValid ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.08em] sa-muted">
                      {t("onboarding", "estimatedDays")}
                    </div>
                    <div className="mt-1 text-xl font-semibold text-emerald-100">
                      {formatNumber(preview.estimatedDays, locale)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.08em] sa-muted">
                      {t("onboarding", "estimatedPrayers")}
                    </div>
                    <div className="mt-1 text-xl font-semibold text-emerald-100">
                      {formatNumber(preview.estimatedPrayers, locale)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm sa-muted">{t("onboarding", "previewInvalid")}</div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <button type="submit" className="sa-btn-primary" disabled={!preview.isValid}>
              {t("onboarding", "submit")}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
