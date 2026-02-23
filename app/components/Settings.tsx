"use client";

import { useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useQadaStorage, type QadaState } from "./useLocalStorage";
import { formatNumber } from "../lib/calculations";
import { useLanguage } from "../i18n/LanguageProvider";
import { LanguageSwitch } from "./LanguageSwitch";

interface SettingsProps {
  onBack: () => void;
  state: QadaState;
  actions: ReturnType<typeof useQadaStorage>["actions"];
}

export function Settings({ onBack, state, actions }: SettingsProps) {
  const { t, locale, isRtl } = useLanguage();
  const [daysToAdd, setDaysToAdd] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const days = parseInt(daysToAdd, 10);
    if (isNaN(days) || days <= 0) {
      setError(t("settings", "errorPositiveNumber"));
      return;
    }

    actions.addDebt(days);
    setDaysToAdd("");
  };

  const handleReset = () => {
    actions.reset();
    setShowResetConfirm(false);
    onBack();
  };

  return (
    <div className="sa-page">
      <div className="sa-shell space-y-6">
        <div className={`sa-topbar ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
            <button onClick={onBack} className="sa-icon-btn" aria-label={t("settings", "backAria")}>
              <ArrowLeft size={22} className={isRtl ? "rotate-180" : ""} />
            </button>
            <h1 className="text-2xl font-semibold tracking-tight">{t("settings", "title")}</h1>
          </div>

          <LanguageSwitch />
        </div>

        <section className="sa-card sa-animate-in">
          <h2 className="mb-2 text-lg font-semibold sa-gold">{t("settings", "totalTarget")}</h2>
          <div className="sa-kpi-value-primary">
            {formatNumber(state.totalTarget, locale)} {t("common", "days")}
          </div>
          <div className="mt-1 text-sm sa-muted">
            {formatNumber(state.completed, locale)} {t("common", "daysCompleted")}
          </div>
        </section>

        <section className="sa-card sa-animate-in">
          <h2 className="mb-4 text-lg font-semibold">{t("settings", "addToDebt")}</h2>

          <form onSubmit={handleAddDebt} className="space-y-4">
            <div>
              <label htmlFor="daysToAdd" className="sa-label">
                {t("settings", "daysToAddLabel")}
              </label>
              <input
                id="daysToAdd"
                type="number"
                min="1"
                inputMode="numeric"
                value={daysToAdd}
                onChange={(e) => {
                  setDaysToAdd(e.target.value);
                  setError("");
                }}
                className="sa-input"
                placeholder={t("settings", "daysToAddPlaceholder")}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <button type="submit" className="sa-btn-primary">
              {t("common", "add")}
            </button>
          </form>
        </section>

        <section className="sa-danger-block sa-animate-in">
          <div className={`mb-4 flex items-start gap-3 ${isRtl ? "flex-row-reverse text-right" : ""}`}>
            <AlertTriangle className="mt-0.5 shrink-0 text-red-300" size={19} />
            <div>
              <h2 className="mb-1 text-lg font-semibold text-red-100">{t("settings", "dangerZone")}</h2>
              <p className="text-sm text-red-100/80">{t("settings", "dangerDescription")}</p>
            </div>
          </div>

          {!showResetConfirm ? (
            <button onClick={() => setShowResetConfirm(true)} className="sa-btn-danger">
              {t("settings", "resetButton")}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-red-300/24 bg-black/25 px-4 py-3 text-center text-sm text-red-50/92">
                <p className="mb-1">{t("settings", "resetConfirmTitle")}</p>
                <p className="text-red-100/82">{t("settings", "resetConfirmMessage")}</p>
              </div>

              <div className="flex gap-3" dir="ltr">
                <button onClick={() => setShowResetConfirm(false)} className="sa-btn-secondary flex-1">
                  {t("common", "cancel")}
                </button>
                <button onClick={handleReset} className="sa-btn-danger flex-1">
                  {t("common", "confirm")}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
