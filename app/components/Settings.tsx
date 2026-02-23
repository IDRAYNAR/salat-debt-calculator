"use client";

import { useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useQadaStorage, type QadaState } from "./useLocalStorage";
import { formatNumber } from "../lib/calculations";

interface SettingsProps {
  onBack: () => void;
  state: QadaState;
  actions: ReturnType<typeof useQadaStorage>["actions"];
}

export function Settings({ onBack, state, actions }: SettingsProps) {
  const [daysToAdd, setDaysToAdd] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState("");

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const days = parseInt(daysToAdd, 10);
    if (isNaN(days) || days <= 0) {
      setError("Veuillez saisir un nombre positif");
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
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-slate-50">Réglages</h1>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-300 mb-2">
            Objectif Total
          </h2>
          <div className="text-3xl font-bold text-emerald-500">
            {formatNumber(state.totalTarget)} jours
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {formatNumber(state.completed)} jours complétés
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">
            Ajouter à la dette
          </h2>
          <form onSubmit={handleAddDebt} className="space-y-4">
            <div>
              <label
                htmlFor="daysToAdd"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Nombre de jours à ajouter
              </label>
              <input
                id="daysToAdd"
                type="number"
                min="1"
                value={daysToAdd}
                onChange={(e) => {
                  setDaysToAdd(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ex: 3"
              />
            </div>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              Ajouter
            </button>
          </form>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h2 className="text-lg font-semibold text-red-400 mb-1">
                Zone de Danger
              </h2>
              <p className="text-sm text-slate-400">
                Réinitialiser supprimera toutes vos données. Cette action est
                irréversible.
              </p>
            </div>
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Reset Total
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <p className="text-slate-300 mb-2">
                  Êtes-vous sûr de vouloir tout réinitialiser ?
                </p>
                <p className="text-sm text-slate-400">
                  Toutes vos données seront perdues.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
