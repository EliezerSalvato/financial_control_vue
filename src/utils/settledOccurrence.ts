import type { SettledTransaction } from '@/types/transaction';

export type YearMonth = {
  month: number;
  year: number;
};

export function toDateKey(value: string | null | undefined): string {
  return value?.slice(0, 10) ?? '';
}

export function yearMonthFromIso(iso: string | null | undefined): YearMonth | null {
  const match = /^(\d{4})-(\d{2})/.exec(iso ?? '');
  const year = match ? Number(match[1]) : NaN;
  const month = match ? Number(match[2]) : NaN;

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { month, year };
}

export function uniqueYearMonths(dates: Array<string | null | undefined>, fallback: YearMonth): YearMonth[] {
  const seen = new Set<string>();
  const periods: YearMonth[] = [];

  const add = (period: YearMonth) => {
    const key = `${period.year}-${period.month}`;

    if (seen.has(key)) return;

    seen.add(key);
    periods.push(period);
  };

  add(fallback);

  for (const iso of dates) {
    const period = yearMonthFromIso(iso);

    if (period) add(period);
  }

  return periods;
}

type SettledOccurrenceItem = {
  id: string;
  currentRecurrenceOn: string;
  openingDate?: string | null;
  closingDate?: string | null;
};

export function settledOnForOccurrence(settledTransactions: SettledTransaction[], item: SettledOccurrenceItem): string | undefined {
  const occurredOn = toDateKey(item.currentRecurrenceOn);
  const exact = settledTransactions.find((settled) => settled.transactionId === item.id && toDateKey(settled.occurredOn) === occurredOn);

  if (exact) return exact.settledOn;

  const opening = toDateKey(item.openingDate);
  const closing = toDateKey(item.closingDate);

  if (!opening || !closing) return undefined;

  return settledTransactions.find((settled) => {
    if (settled.transactionId !== item.id) return false;

    const occurred = toDateKey(settled.occurredOn);

    return occurred >= opening && occurred <= closing;
  })?.settledOn;
}
