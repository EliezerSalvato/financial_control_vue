export type IsoDateParts = { year: number; month: number; day: number };

export function parseIsoDate(iso: string): IsoDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const year = match ? Number(match[1]) : NaN;
  const month = match ? Number(match[2]) : NaN;
  const day = match ? Number(match[3]) : NaN;

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12) {
    return null;
  }

  return { year, month, day };
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function makeIsoDateClamped(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month, 0).getDate();

  return toIsoDate(year, month, Math.min(day, lastDay));
}

export function shiftYearMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;

  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function addDaysToIsoDate(iso: string, days: number): string | null {
  const parsed = parseIsoDate(iso);

  if (!parsed) return null;

  const utc = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days));

  return toIsoDate(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

export function yearMonthTotal(iso: string): number | null {
  const parsed = parseIsoDate(iso);

  return parsed ? parsed.year * 12 + (parsed.month - 1) : null;
}

export function monthsBetweenInclusive(startIso: string, endIso: string): number | null {
  const startTotal = yearMonthTotal(startIso);
  const endTotal = yearMonthTotal(endIso);

  if (startTotal == null || endTotal == null) return null;

  const months = endTotal - startTotal;

  return months < 0 ? null : months + 1;
}

export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const parsed = parseIsoDate(isoDate);

  if (!parsed) return isoDate;

  const shifted = shiftYearMonth(parsed.year, parsed.month, months);

  return makeIsoDateClamped(shifted.year, shifted.month, parsed.day);
}
