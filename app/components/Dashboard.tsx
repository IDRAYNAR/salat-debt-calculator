"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Settings } from "lucide-react";
import { useQadaStorage } from "./useLocalStorage";
import { ProgressCircle } from "./ProgressCircle";
import { calculateProgress, formatNumber } from "../lib/calculations";
import { Settings as SettingsComponent } from "./Settings";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLanguage } from "../i18n/LanguageProvider";

export function Dashboard() {
  const { state, actions } = useQadaStorage();
  const { t, locale, isRtl } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const progress = calculateProgress(state.completed, state.totalTarget);
  const remaining = Math.max(0, state.totalTarget - state.completed);

  const handleIncrement = () => {
    setIsAnimating(true);
    actions.incrementDay();
    setTimeout(() => setIsAnimating(false), 280);
  };

  const handleDecrement = () => {
    actions.decrementDay();
  };

  if (showSettings) {
    return (
      <SettingsComponent
        onBack={() => setShowSettings(false)}
        state={state}
        actions={actions}
      />
    );
  }

  return (
    <div className="sa-page">
      <div className="sa-shell space-y-7">
        <div className={`sa-topbar ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="sa-card-soft px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase sa-gold">
            {t("common", "appName")}
          </div>

          <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
            <LanguageSwitch />
            <button
              onClick={() => setShowSettings(true)}
              className="sa-icon-btn"
              aria-label={t("dashboard", "settingsAria")}
            >
              <Settings size={22} />
            </button>
          </div>
        </div>

        <section className="sa-card sa-animate-in">
          <div className="mb-6 flex justify-center">
            <ProgressCircle progress={progress} size={230} strokeWidth={14} locale={locale} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value-primary mb-1">{formatNumber(state.completed, locale)}</div>
              <div className="text-sm sa-muted">{t("dashboard", "daysCompleted")}</div>
            </div>

            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value mb-1">{formatNumber(remaining, locale)}</div>
              <div className="text-sm sa-muted">{t("dashboard", "daysRemaining")}</div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <button
            onClick={handleIncrement}
            disabled={state.completed >= state.totalTarget}
            className={`sa-btn-primary ${isAnimating ? "scale-[0.99]" : ""}`}
          >
            <CheckCircle2 size={22} />
            <span>{t("dashboard", "incrementButton")}</span>
          </button>

          {state.completed > 0 && (
            <button onClick={handleDecrement} className="sa-btn-secondary">
              <RotateCcw size={18} />
              <span>{t("dashboard", "undo")}</span>
            </button>
          )}
        </section>

        {state.completed >= state.totalTarget && state.totalTarget > 0 && (
          <div className="sa-success-block sa-animate-in">
            <div className="mb-1 text-base font-semibold text-emerald-200">
              {t("dashboard", "congratsTitle")}
            </div>
            <div className="text-sm sa-muted">{t("dashboard", "congratsMessage")}</div>
          </div>
        )}
      </div>
    </div>
  );
}
