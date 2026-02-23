import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qadâ' – Suivi des Prières Manquées",
  description: "Application hors-ligne (LocalStorage) pour suivre et rattraper tes prières manquées (Qadâ').",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-dvh bg-slate-900 text-slate-50 antialiased">{children}</body>
    </html>
  );
}

