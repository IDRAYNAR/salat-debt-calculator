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
      <div className="sa-page flex items-center justify-center">
        <div className="sa-card-soft px-6 py-4 text-sm font-medium sa-muted">{t("common", "loading")}</div>
      </div>
    );
  }

  if (!state.initialized) {
    return <OnboardingForm />;
  }

  return <Dashboard />;
}
