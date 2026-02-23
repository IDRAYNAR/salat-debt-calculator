"use client";

import { useQadaStorage } from "./components/useLocalStorage";
import { OnboardingForm } from "./components/OnboardingForm";
import { Dashboard } from "./components/Dashboard";

export default function Home() {
  const { mounted, state } = useQadaStorage();

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Chargement...</div>
      </div>
    );
  }

  if (!state.initialized) {
    return <OnboardingForm />;
  }

  return <Dashboard />;
}
