import type { TransactionRecurrenceType } from '@/types/transaction';
import { addDaysToIsoDate, makeIsoDateClamped, monthsBetweenInclusive, parseIsoDate, shiftYearMonth, yearMonthTotal } from '@/utils/isoDate';

export type InstallmentLabelSource = {
  recurrenceType: TransactionRecurrenceType;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  openingDate: string;
  closingDate: string;
  endsOn: string | null;
  canceledOn: string | null;
};

function cycleClosingDay(item: InstallmentLabelSource): number | null {
  const closing = parseIsoDate(item.closingDate);
  const previousClosing = addDaysToIsoDate(item.openingDate, -1);
  const previous = previousClosing ? parseIsoDate(previousClosing) : null;

  if (!closing || !previous) return null;

  return Math.max(closing.day, previous.day);
}

function firstCycleClosingOnOrAfter(iso: string, closingDay: number): string | null {
  const parsed = parseIsoDate(iso);

  if (!parsed) return null;

  const closing = makeIsoDateClamped(parsed.year, parsed.month, closingDay);

  if (closing >= iso) return closing;

  const next = shiftYearMonth(parsed.year, parsed.month, 1);

  return makeIsoDateClamped(next.year, next.month, closingDay);
}

function installmentCurrent(item: InstallmentLabelSource): number | null {
  const closingDay = cycleClosingDay(item);
  const firstClosing = closingDay != null ? firstCycleClosingOnOrAfter(item.firstRecurrenceOn, closingDay) : null;

  return firstClosing ? monthsBetweenInclusive(firstClosing, item.closingDate) : null;
}

function lastInstallmentYearMonth(canceledOn: string, currentRecurrenceOn: string): number | null {
  const canceled = parseIsoDate(canceledOn);
  const recurrence = parseIsoDate(currentRecurrenceOn);

  if (!canceled || !recurrence) return null;

  const canceledTotal = canceled.year * 12 + (canceled.month - 1);

  return canceled.day >= recurrence.day ? canceledTotal : canceledTotal - 1;
}

function installmentTotal(item: InstallmentLabelSource): number | null {
  if (item.canceledOn) {
    const firstTotal = yearMonthTotal(item.firstRecurrenceOn);
    const lastTotal = lastInstallmentYearMonth(item.canceledOn, item.currentRecurrenceOn);

    if (firstTotal == null || lastTotal == null) return null;

    const months = lastTotal - firstTotal;

    return months < 0 ? 0 : months + 1;
  }

  if (!item.endsOn) return null;

  return monthsBetweenInclusive(item.firstRecurrenceOn, item.endsOn);
}

export function installmentLabel(item: InstallmentLabelSource): string {
  if (item.recurrenceType === 'one_time') return '';

  // currentRecurrenceOn can skip/repeat calendar months (day 31 after February), so count billing cycles.
  const current = installmentCurrent(item);

  if (current == null) return '';

  const total = installmentTotal(item);

  if (total == null) return ` - ${current}/∞`;

  return ` - ${Math.min(current, total)}/${total}`;
}
