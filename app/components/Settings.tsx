"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  DatabaseBackup,
  Download,
  History,
  Trash2,
  Upload
} from "lucide-react";
import type { QadaState, useQadaStorage } from "./useLocalStorage";
import { formatNumber, formatPercent } from "../lib/calculations";
import { parseBackup, serializeBackup, type BackupError } from "../lib/backup";
import { useLanguage } from "../i18n/LanguageProvider";
import { LanguageSwitch } from "./LanguageSwitch";

const BACKUP_ERROR_KEYS: Record<
  BackupError,
  | "importErrorInvalidJson"
  | "importErrorUnsupportedVersion"
  | "importErrorInvalidTracker"
  | "importErrorInvalidLocale"
  | "importErrorPayloadTooLarge"
> = {
  invalid_json: "importErrorInvalidJson",
  unsupported_version: "importErrorUnsupportedVersion",
  invalid_tracker: "importErrorInvalidTracker",
  invalid_locale: "importErrorInvalidLocale",
  payload_too_large: "importErrorPayloadTooLarge"
};

interface SettingsProps {
  onBack: () => void;
  state: QadaState;
  actions: ReturnType<typeof useQadaStorage>["actions"];
  history: ReturnType<typeof useQadaStorage>["history"];
  stats: ReturnType<typeof useQadaStorage>["stats"];
}

export function Settings({ onBack, state, actions, history, stats }: SettingsProps) {
  const { t, locale, isRtl, setLocale } = useLanguage();
  const [daysToAdd, setDaysToAdd] = useState("");
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: "success" | "error";
  } | null>(null);

  const clearMessages = () => {
    setToast(null);
  };

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const pushToast = (message: string, tone: "success" | "error") => {
    setToast({
      id: Date.now() + Math.random(),
      message,
      tone
    });
  };

  const askConfirmation = (title: string, message: string) => {
    return window.confirm(`${title}\n\n${message}`);
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const days = parseInt(daysToAdd, 10);
    if (isNaN(days) || days <= 0) {
      pushToast(t("settings", "errorPositiveNumber"), "error");
      return;
    }

    actions.addDebt(days);
    setDaysToAdd("");
    pushToast(t("settings", "addDebtUndoHint"), "success");
  };

  const handleExportBackup = () => {
    clearMessages();

    try {
      const tracker = actions.getPersistedTracker();
      const payload = serializeBackup(tracker, locale === "fr" || locale === "ar" ? locale : "en");
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
      anchor.href = url;
      anchor.download = `qada-backup-${timestamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
      pushToast(t("settings", "exportSuccess"), "success");
    } catch {
      pushToast(t("settings", "importErrorUnknown"), "error");
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();

    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = parseBackup(raw);

      if (!parsed.ok) {
        pushToast(t("settings", BACKUP_ERROR_KEYS[parsed.error]), "error");
        return;
      }

      const confirmed = askConfirmation(
        t("settings", "confirmImportTitle"),
        t("settings", "confirmImportMessage")
      );
      if (!confirmed) return;

      actions.replaceTracker(parsed.data.tracker);
      setLocale(parsed.data.preferences.locale);
      pushToast(t("settings", "importSuccess"), "success");
    } catch {
      pushToast(t("settings", "importErrorUnknown"), "error");
    }
  };

  const handleClearHistory = () => {
    clearMessages();

    const confirmed = askConfirmation(
      t("settings", "confirmClearHistoryTitle"),
      t("settings", "confirmClearHistoryMessage")
    );
    if (!confirmed) return;

    actions.clearHistory();
    pushToast(t("settings", "historyClearedSuccess"), "success");
  };

  const handleClearRedo = () => {
    clearMessages();

    const confirmed = askConfirmation(
      t("settings", "confirmClearRedoTitle"),
      t("settings", "confirmClearRedoMessage")
    );
    if (!confirmed) return;

    actions.clearRedo();
    pushToast(t("settings", "redoClearedSuccess"), "success");
  };

  const handleReset = () => {
    const confirmed = askConfirmation(t("settings", "resetConfirmTitle"), t("settings", "resetConfirmMessage"));
    if (!confirmed) return;

    actions.reset();
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
          <h2 className="sa-settings-section-title">{t("settings", "advancedOverview")}</h2>

          <div className="sa-settings-grid">
            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value-primary">{formatPercent(stats.progress, locale)}</div>
              <div className="text-xs uppercase tracking-[0.08em] sa-muted">{t("settings", "progressLabel")}</div>
            </div>

            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value">{formatNumber(stats.totalPrayersCompleted, locale)}</div>
              <div className="text-xs uppercase tracking-[0.08em] sa-muted">{t("settings", "totalPrayersCompleted")}</div>
            </div>

            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value">{formatNumber(stats.totalPrayersRemaining, locale)}</div>
              <div className="text-xs uppercase tracking-[0.08em] sa-muted">{t("settings", "totalPrayersRemaining")}</div>
            </div>

            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value">{formatNumber(stats.surplusDays, locale)}</div>
              <div className="text-xs uppercase tracking-[0.08em] sa-muted">{t("settings", "surplusLabel")}</div>
            </div>
          </div>

          <div className="mt-4 text-sm sa-muted">
            {formatNumber(state.totalTarget, locale)} {t("common", "days")} - {formatNumber(stats.totalPrayersTarget, locale)} {t("settings", "totalPrayers")}
          </div>
          <div className="text-sm sa-muted">
            {formatNumber(stats.daysCompleted, locale)} {t("common", "daysCompleted")}
          </div>
          <div className="text-sm sa-muted">
            {formatNumber(stats.daysRemaining, locale)} {t("dashboard", "daysRemaining")}
          </div>
        </section>

        <section className="sa-card sa-animate-in">
          <h2 className="sa-settings-section-title">{t("settings", "addToDebt")}</h2>

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
                  clearMessages();
                }}
                className="sa-input"
                placeholder={t("settings", "daysToAddPlaceholder")}
              />
            </div>

            <button type="submit" className="sa-btn-primary">
              {t("common", "add")}
            </button>
          </form>
        </section>

        <section className="sa-card sa-animate-in">
          <div className="mb-4 flex items-center gap-2">
            <History size={18} className="sa-gold" />
            <h2 className="sa-settings-section-title mb-0">{t("settings", "historySectionTitle")}</h2>
          </div>

          <div className="sa-history-admin-row">
            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value">{formatNumber(history.undoCount, locale)}</div>
              <div className="text-sm sa-muted">{t("settings", "historyUndoCount")}</div>
            </div>
            <div className="sa-card-soft text-center">
              <div className="sa-kpi-value">{formatNumber(history.redoCount, locale)}</div>
              <div className="text-sm sa-muted">{t("settings", "historyRedoCount")}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={handleClearHistory}
              disabled={!history.canUndo && !history.canRedo}
              className="sa-btn-secondary"
            >
              <Trash2 size={16} />
              <span>{t("settings", "clearHistoryButton")}</span>
            </button>

            <button onClick={handleClearRedo} disabled={!history.canRedo} className="sa-btn-secondary">
              <History size={16} />
              <span>{t("settings", "clearRedoButton")}</span>
            </button>
          </div>
        </section>

        <section className="sa-card sa-animate-in">
          <div className="mb-4 flex items-center gap-2">
            <DatabaseBackup size={18} className="sa-gold" />
            <h2 className="sa-settings-section-title mb-0">{t("settings", "backupSectionTitle")}</h2>
          </div>

          <div className="sa-backup-actions">
            <button onClick={handleExportBackup} className="sa-btn-secondary">
              <Download size={16} />
              <span>{t("settings", "exportButton")}</span>
            </button>

            <label className="sa-file-input">
              <Upload size={16} />
              <span>{t("settings", "importLabel")}</span>
              <input type="file" accept="application/json" onChange={handleImportFile} />
            </label>
          </div>

          <p className="mt-3 text-sm sa-muted">{t("settings", "importHint")}</p>
        </section>

        <section className="sa-danger-block sa-animate-in">
          <div className={`mb-4 flex items-start gap-3 ${isRtl ? "flex-row-reverse text-right" : ""}`}>
            <AlertTriangle className="mt-0.5 shrink-0 text-red-300" size={19} />
            <div>
              <h2 className="mb-1 text-lg font-semibold text-red-100">{t("settings", "dangerZone")}</h2>
              <p className="text-sm text-red-100/80">{t("settings", "dangerDescription")}</p>
            </div>
          </div>

          <button onClick={handleReset} className="sa-btn-danger">
            {t("settings", "resetButton")}
          </button>
        </section>

        {toast && (
          <div className="sa-toast-stack" aria-live="polite">
            <div className={`sa-toast ${toast.tone === "error" ? "sa-toast-error" : ""}`}>{toast.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
