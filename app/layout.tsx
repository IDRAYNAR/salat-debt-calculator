import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Qadâ' – Missed Prayers Tracker",
  description: "Offline (LocalStorage) app to track and catch up on your missed prayers (Qadâ').",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-dvh bg-slate-900 text-slate-50 antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

