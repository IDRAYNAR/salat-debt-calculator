"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, Redo2, RotateCcw, Settings, Undo2 } from "lucide-react";
import { useQadaStorage, type HistoryAction } from "./useLocalStorage";
import { ProgressCircle } from "./ProgressCircle";
import { PRAYER_KEYS, formatNumber, type PrayerKey } from "../lib/calculations";
import { Settings as SettingsComponent } from "./Settings";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLanguage } from "../i18n/LanguageProvider";

const PRAYER_LABELS: Record<
  PrayerKey,
  "prayerFajr" | "prayerDhuhr" | "prayerAsr" | "prayerMaghrib" | "prayerIsha"
> = {
  fajr: "prayerFajr",
  dhuhr: "prayerDhuhr",
  asr: "prayerAsr",
  maghrib: "prayerMaghrib",
  isha: "prayerIsha"
};

export function Dashboard() {
  const { state, actions, stats, history } = useQadaStorage();
  const { t, locale, isRtl } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ nonce: number; message: string } | null>(null);

  const progress = stats.progress;
  const remainingDays = stats.daysRemaining;
  const completedDays = stats.daysCompleted;
  const remainingPrayers = Math.max(0, stats.totalPrayersRemaining);
  const canUndoDay = stats.totalPrayersCompleted > 0;

  const formatHistoryAction = useMemo(() => {
    return (action: HistoryAction | null) => {
      if (!action) return t("dashboard", "historyNoAction");

      if (action.type === "increment_day") {
        return t("dashboard", "historyActionIncrementDay");
      }

      if (action.type === "decrement_day") {
        return t("dashboard", "historyActionDecrementDay");
      }

      if (action.type === "complete_prayer") {
        const prayer = action.prayer ? t("dashboard", PRAYER_LABELS[action.prayer]) : "";
        return `${t("dashboard", "historyActionCompletePrayer")} ${prayer}`.trim();
      }

      if (action.type === "undo_prayer") {
        const prayer = action.prayer ? t("dashboard", PRAYER_LABELS[action.prayer]) : "";
        return `${t("dashboard", "historyActionUndoPrayer")} ${prayer}`.trim();
      }

      if (action.type === "adjust_prayer") {
        const prayer = action.prayer ? t("dashboard", PRAYER_LABELS[action.prayer]) : "";
        const delta = Math.trunc(action.amount ?? 0);
        const prefix = delta >= 0 ? "+" : "";
        return `${t("dashboard", "historyActionAdjustPrayer")} ${prayer} (${prefix}${formatNumber(delta, locale)})`;
      }

      const amount = Math.max(0, Math.floor(action.amount ?? 0));
      if (action.type === "add_debt") {
        return `${t("dashboard", "historyActionAddDebt")} ${formatNumber(amount, locale)} ${t("common", "days")}`;
      }

      if (action.type === "clear_redo") {
        return t("dashboard", "historyActionClearRedo");
      }

      if (action.type === "clear_history") {
        return t("dashboard", "historyActionClearHistory");
      }

      if (action.type === "import_backup") {
        return t("dashboard", "historyActionImportBackup");
      }

      return t("dashboard", "historyNoAction");
    };
  }, [locale, t]);

  const nextUndoLabel = useMemo(() => {
    if (!history.nextUndoAction) return t("dashboard", "nextUndoEmpty");
    return `${t("dashboard", "nextUndoLabel")} ${formatHistoryAction(history.nextUndoAction)}`;
  }, [formatHistoryAction, history.nextUndoAction, t]);

  const nextRedoLabel = useMemo(() => {
    if (!history.nextRedoAction) return t("dashboard", "nextRedoEmpty");
    return `${t("dashboard", "nextRedoLabel")} ${formatHistoryAction(history.nextRedoAction)}`;
  }, [formatHistoryAction, history.nextRedoAction, t]);

  useEffect(() => {
    if (!history.lastEvent) return;

    const prefix =
      history.lastEvent.mode === "undo"
        ? t("dashboard", "toastUndoPrefix")
        : t("dashboard", "toastRedoPrefix");
    const label = formatHistoryAction(history.lastEvent.action);
    const payload = {
      nonce: history.lastEvent.nonce,
      message: `${prefix} ${label}`.trim()
    };

    setToastMessage(payload);
    const timeout = window.setTimeout(() => {
      setToastMessage((current) => (current?.nonce === payload.nonce ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [formatHistoryAction, history.lastEvent, t]);

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
        history={history}
        stats={stats}
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

        <section className="sa-history-bar sa-animate-in">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              onClick={actions.undo}
              disabled={!history.canUndo}
              className="sa-history-btn"
              aria-label={t("dashboard", "undoAria")}
            >
              <Undo2 size={16} />
              <span>{t("dashboard", "undoButton")}</span>
              <span className="sa-history-badge">{formatNumber(history.undoCount, locale)}</span>
            </button>

            <button
              onClick={actions.redo}
              disabled={!history.canRedo}
              className="sa-history-btn"
              aria-label={t("dashboard", "redoAria")}
            >
              <Redo2 size={16} />
              <span>{t("dashboard", "redoButton")}</span>
              <span className="sa-history-badge">{formatNumber(history.redoCount, locale)}</span>
            </button>
          </div>

          <div className={`sa-history-label space-y-1 ${isRtl ? "text-right" : "text-left"}`}>
            <p>{nextUndoLabel}</p>
            <p>{nextRedoLabel}</p>
          </div>
        </section>

        <section className="sa-card sa-animate-in">
          <div className="mb-6 flex justify-center">
            <ProgressCircle progress={progress} size={230} strokeWidth={14} locale={locale} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value-primary mb-1">{formatNumber(completedDays, locale)}</div>
              <div className="text-sm sa-muted">{t("dashboard", "daysCompleted")}</div>
            </div>

            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value mb-1">{formatNumber(remainingDays, locale)}</div>
              <div className="text-sm sa-muted">{t("dashboard", "daysRemaining")}</div>
            </div>

            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value mb-1">{formatNumber(remainingPrayers, locale)}</div>
              <div className="text-sm sa-muted">{t("dashboard", "prayersRemaining")}</div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <button onClick={handleIncrement} className={`sa-btn-primary ${isAnimating ? "scale-[0.99]" : ""}`}>
            <CheckCircle2 size={22} />
            <span>{t("dashboard", "incrementButton")}</span>
          </button>

          {canUndoDay && (
            <button onClick={handleDecrement} className="sa-btn-secondary">
              <RotateCcw size={18} />
              <span>{t("dashboard", "decrementButton")}</span>
            </button>
          )}
        </section>

        <section className="sa-card sa-animate-in">
          <h2 className={`mb-4 text-lg font-semibold ${isRtl ? "text-right" : "text-left"}`}>
            {t("dashboard", "prayersRemainingTitle")}
          </h2>

          <div className="sa-prayer-list">
            {PRAYER_KEYS.map((prayer) => {
              const label = t("dashboard", PRAYER_LABELS[prayer]);
              const value = state.prayersRemaining[prayer];
              const canUndoPrayer = value < state.totalTarget;

              return (
                <div key={prayer} className={`sa-prayer-row ${isRtl ? "flex-row-reverse" : ""}`}>
                  <span className="sa-prayer-label">{label}</span>

                  <div className={`sa-prayer-stepper ${isRtl ? "flex-row-reverse" : ""}`}>
                    <button
                      onClick={() => actions.adjustPrayer(prayer, -1, "dashboard")}
                      className="sa-step-btn"
                      aria-label={`${t("dashboard", "prayerMinusAria")} ${label}`}
                    >
                      <Minus size={16} />
                    </button>
                    <div className="sa-prayer-count">{formatNumber(value, locale)}</div>
                    <button
                      onClick={() => actions.adjustPrayer(prayer, 1, "dashboard")}
                      className="sa-step-btn"
                      aria-label={`${t("dashboard", "prayerPlusAria")} ${label}`}
                      disabled={!canUndoPrayer}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {(stats.surplusDays > 0 || stats.surplusPrayersRemainder > 0) && (
          <div className="sa-surplus-block sa-animate-in">
            <div className="mb-1 text-base font-semibold text-emerald-200">{t("dashboard", "surplusTitle")}</div>
            <div className="text-sm sa-muted">
              {formatNumber(stats.surplusDays, locale)} {t("dashboard", "surplusDays")} -{" "}
              {formatNumber(stats.surplusPrayersRemainder, locale)} {t("dashboard", "surplusPrayers")}
            </div>
          </div>
        )}

        {stats.daysRemaining === 0 && state.totalTarget > 0 && (
          <div className="sa-success-block sa-animate-in">
            <div className="mb-1 text-base font-semibold text-emerald-200">{t("dashboard", "congratsTitle")}</div>
            <div className="text-sm sa-muted">{t("dashboard", "congratsMessage")}</div>
          </div>
        )}

        {toastMessage && (
          <div className="sa-toast-stack" aria-live="polite">
            <div className="sa-toast">{toastMessage.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
