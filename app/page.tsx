"use client";

import { useQadaStorage } from "./components/useLocalStorage";
import { OnboardingForm } from "./components/OnboardingForm";
import { Dashboard } from "./components/Dashboard";
import { useLanguage } from "./i18n/LanguageProvider";

export default function Home() {
  const { mounted, state } = useQadaStorage();
  const { t, mounted: langMounted } = useLanguage();

  if (!mounted || !langMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">{t("common", "loading")}</div>
      </div>
    );
  }

  if (!state.initialized) {
    return <OnboardingForm />;
  }

  return <Dashboard />;
}
