"use client";

import { useState } from "react";
import { Settings, CheckCircle2, RotateCcw } from "lucide-react";
import { useQadaStorage } from "./useLocalStorage";
import { ProgressCircle } from "./ProgressCircle";
import { calculateProgress, formatNumber } from "../lib/calculations";
import { Settings as SettingsComponent } from "./Settings";
import { LanguageSwitch } from "./LanguageSwitch";
import { useLanguage } from "../i18n/LanguageProvider";

export function Dashboard() {
  const { state, actions } = useQadaStorage();
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const progress = calculateProgress(state.completed, state.totalTarget);
  const remaining = Math.max(0, state.totalTarget - state.completed);

  const handleIncrement = () => {
    setIsAnimating(true);
    actions.incrementDay();
    setTimeout(() => setIsAnimating(false), 300);
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
    <div className="min-h-screen p-4 pb-8">
      <div className="flex justify-end items-center gap-2 mb-6">
        <LanguageSwitch />
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
          aria-label={t("dashboard", "settingsAria")}
        >
          <Settings size={24} />
        </button>
      </div>

      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-center">
          <ProgressCircle
            progress={progress}
            size={220}
            strokeWidth={14}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-emerald-500 mb-1">
              {formatNumber(state.completed)}
            </div>
            <div className="text-sm text-slate-400">{t("dashboard", "daysCompleted")}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-2xl font-bold text-slate-300 mb-1">
              {formatNumber(remaining)}
            </div>
            <div className="text-sm text-slate-400">{t("dashboard", "daysRemaining")}</div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleIncrement}
            disabled={state.completed >= state.totalTarget}
            className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform ${
              isAnimating
                ? "scale-95"
                : "hover:scale-105 active:scale-95"
            } ${
              state.completed >= state.totalTarget
                ? "opacity-50 cursor-not-allowed"
                : ""
            } flex items-center justify-center gap-2`}
          >
            <CheckCircle2 size={24} />
            <span>{t("dashboard", "incrementButton")}</span>
          </button>

          {state.completed > 0 && (
            <button
              onClick={handleDecrement}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              <span>{t("dashboard", "undo")}</span>
            </button>
          )}
        </div>

        {state.completed >= state.totalTarget && state.totalTarget > 0 && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 text-center">
            <div className="text-emerald-400 font-semibold mb-1">
              {t("dashboard", "congratsTitle")}
            </div>
            <div className="text-sm text-slate-300">
              {t("dashboard", "congratsMessage")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
