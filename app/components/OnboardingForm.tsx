"use client";

import { useState } from "react";
import { useQadaStorage } from "./useLocalStorage";
import { calculateTotalDays } from "../lib/calculations";

export function OnboardingForm() {
  const { actions } = useQadaStorage();
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
      setError("Les valeurs doivent être positives");
      return;
    }

    if (yearsNum === 0 && monthsNum === 0 && daysNum === 0) {
      setError("Veuillez saisir au moins une valeur");
      return;
    }

    const totalDays = calculateTotalDays(yearsNum, monthsNum, daysNum);
    if (totalDays <= 0) {
      setError("Le total doit être supérieur à 0");
      return;
    }

    actions.start(totalDays);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">
            Suivi des Prières Manquées
          </h1>
          <p className="text-slate-400">
            Calculez votre dette de prières et commencez votre rattrapage
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-lg p-6 space-y-6 shadow-xl"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="years"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Années
              </label>
              <input
                id="years"
                type="number"
                min="0"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label
                htmlFor="months"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Mois
              </label>
              <input
                id="months"
                type="number"
                min="0"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            <div>
              <label
                htmlFor="days"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Jours
              </label>
              <input
                id="days"
                type="number"
                min="0"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
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
            Calculer et Commencer
          </button>
        </form>
      </div>
    </div>
  );
}
