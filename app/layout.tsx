import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./i18n/LanguageProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo"
});

const languageBootScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("qada-tracker:lang");
    const locale = stored === "ar" || stored === "fr" ? stored : "en";
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
  } catch {}
})();
`;

export const metadata: Metadata = {
  title: "Qada Tracker - Missed Prayers",
  description: "Offline app to track and catch up missed prayers (Qada) in English, French, and Arabic.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} min-h-dvh antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: languageBootScript }} />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
