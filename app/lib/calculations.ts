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

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("fr-FR").format(num);
}
