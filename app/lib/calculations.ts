export const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type PrayerKey = (typeof PRAYER_KEYS)[number];
export type PrayerCounts = Record<PrayerKey, number>;

const PRAYERS_PER_DAY = PRAYER_KEYS.length;

function normalizeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.floor(value);
}

export function buildPrayerCounts(days: number): PrayerCounts {
  const safeDays = Math.max(0, normalizeInteger(days));
  return {
    fajr: safeDays,
    dhuhr: safeDays,
    asr: safeDays,
    maghrib: safeDays,
    isha: safeDays
  };
}

export function sumPrayerCounts(counts: PrayerCounts): number {
  return PRAYER_KEYS.reduce((total, key) => total + normalizeInteger(counts[key]), 0);
}

export type PrayerStats = {
  totalPrayersTarget: number;
  totalPrayersRemaining: number;
  totalPrayersCompleted: number;
  daysRemaining: number;
  daysCompleted: number;
  surplusDays: number;
  surplusPrayersRemainder: number;
  progress: number;
};

export function derivePrayerStats(totalTarget: number, prayersRemaining: PrayerCounts): PrayerStats {
  const safeTotalTarget = Math.max(0, normalizeInteger(totalTarget));
  const normalizedRemaining = PRAYER_KEYS.reduce((total, key) => {
    const value = normalizeInteger(prayersRemaining[key]);
    return total + value;
  }, 0);

  const totalPrayersTarget = safeTotalTarget * PRAYERS_PER_DAY;
  const totalPrayersRemaining = normalizedRemaining;
  const totalPrayersCompleted = Math.max(0, totalPrayersTarget - totalPrayersRemaining);
  const daysRemaining = Math.max(0, Math.ceil(totalPrayersRemaining / PRAYERS_PER_DAY));
  const rawDaysCompleted = Math.floor(totalPrayersCompleted / PRAYERS_PER_DAY);
  const daysCompleted = Math.max(0, Math.min(safeTotalTarget, rawDaysCompleted));

  const surplusPrayers = Math.max(0, -totalPrayersRemaining);
  const surplusDays = Math.floor(surplusPrayers / PRAYERS_PER_DAY);
  const surplusPrayersRemainder = surplusPrayers % PRAYERS_PER_DAY;

  const progressCompleted = Math.max(0, Math.min(totalPrayersCompleted, totalPrayersTarget));
  const progress = calculateProgress(progressCompleted, totalPrayersTarget);

  return {
    totalPrayersTarget,
    totalPrayersRemaining,
    totalPrayersCompleted,
    daysRemaining,
    daysCompleted,
    surplusDays,
    surplusPrayersRemainder,
    progress
  };
}

export function calculateTotalDays(
  years: number,
  months: number,
  days: number
): number {
  const totalDays = years * 365.25 + months * 30 + days;
  return Math.round(totalDays);
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  const progress = (completed / total) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 100) / 100));
}

export type NumberLocale = "en" | "fr" | "ar";

const ARABIC_INDIC_DIGITS: Record<string, string> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩"
};

const ARABIC_INDIC_DIGIT_PATTERN = /[٠-٩]/;
const ASCII_DIGIT_PATTERN = /\d/g;
const FORMATTER_CACHE: Partial<Record<NumberLocale, (num: number) => string>> = {};

function toArabicIndicNumerals(value: string): string {
  return value
    .replace(ASCII_DIGIT_PATTERN, (digit) => ARABIC_INDIC_DIGITS[digit] ?? digit)
    .replace(/,/g, "٬")
    .replace(/\./g, "٫");
}

function createFormatter(locale: NumberLocale): (num: number) => string {
  if (locale === "ar") {
    const probe = 1234567890;
    const candidates: Intl.NumberFormat[] = [
      new Intl.NumberFormat("ar-SA-u-nu-arab"),
      new Intl.NumberFormat("ar-SA", { numberingSystem: "arab" }),
      new Intl.NumberFormat("ar", { numberingSystem: "arab" })
    ];

    for (const candidate of candidates) {
      if (ARABIC_INDIC_DIGIT_PATTERN.test(candidate.format(probe))) {
        return (num: number) => candidate.format(num);
      }
    }

    const latinFallback = new Intl.NumberFormat("en-US");
    return (num: number) => toArabicIndicNumerals(latinFallback.format(num));
  }

  if (locale === "fr") {
    const frFormatter = new Intl.NumberFormat("fr-FR");
    return (num: number) => frFormatter.format(num);
  }

  const enFormatter = new Intl.NumberFormat("en-US");
  return (num: number) => enFormatter.format(num);
}

function getFormatter(locale: NumberLocale): (num: number) => string {
  const cached = FORMATTER_CACHE[locale];
  if (cached) return cached;

  const created = createFormatter(locale);
  FORMATTER_CACHE[locale] = created;
  return created;
}

export function formatNumber(num: number, locale: NumberLocale = "en"): string {
  const normalized = Number.isFinite(num) ? num : 0;
  return getFormatter(locale)(normalized);
}

export function formatPercent(value: number, locale: NumberLocale = "en"): string {
  const symbol = locale === "ar" ? "٪" : "%";
  return `${formatNumber(value, locale)}${symbol}`;
}
