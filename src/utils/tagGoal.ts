import type { AppLocale } from '@/locales/locale';
import type { Tag, TagCreatePayload, TagForm, TagGoal } from '@/types/tag';
import { getZonedDateParts } from '@/locales/locale';
import { addMonthsToIsoDate, monthStartFromIso, toMonthStartIso, yearMonthTotal } from '@/utils/isoDate';

export function tagGoalStartsOn(goal: Pick<TagGoal, 'month' | 'year'>): string {
  return toMonthStartIso(goal.year, goal.month);
}

export function firstTagGoalStartsOn(goals: TagGoal[]): string | null {
  const first = [...goals].sort((left, right) => tagGoalStartsOn(left).localeCompare(tagGoalStartsOn(right)))[0];

  return first ? tagGoalStartsOn(first) : null;
}

export function lastTagGoalStartsOn(goals: Pick<TagGoal, 'month' | 'year'>[]): string | null {
  const sorted = [...goals].sort((left, right) => tagGoalStartsOn(left).localeCompare(tagGoalStartsOn(right)));
  const last = sorted[sorted.length - 1];

  return last ? tagGoalStartsOn(last) : null;
}

export function minGoalEndsOn(goals: Pick<TagGoal, 'month' | 'year'>[]): string | null {
  const last = lastTagGoalStartsOn(goals);

  return last ? addMonthsToIsoDate(last, 1) : null;
}

export function goalEndsOnConflictsWithExistingGoals(endsOn: string | null | undefined, goals: Pick<TagGoal, 'month' | 'year'>[]): boolean {
  if (!endsOn || goals.length === 0) return false;

  const minEndsOn = minGoalEndsOn(goals);
  const endsTotal = yearMonthTotal(monthStartFromIso(endsOn) ?? endsOn);
  const minTotal = minEndsOn ? yearMonthTotal(minEndsOn) : null;

  return endsTotal != null && minTotal != null && endsTotal < minTotal;
}

export function currentTagGoalValue(tag: Pick<Tag, 'currentGoal' | 'goals'>): number | null {
  if (tag.currentGoal) return tag.currentGoal.value;

  const sorted = [...tag.goals].sort((left, right) => tagGoalStartsOn(left).localeCompare(tagGoalStartsOn(right)));
  const last = sorted[sorted.length - 1];

  return last?.value ?? null;
}

export function hasTagGoalInMonth(goals: TagGoal[], year: number, month: number): boolean {
  return goals.some((goal) => goal.year === year && goal.month === month);
}

export function defaultTagGoalStartsOn(goals: TagGoal[], locale: AppLocale): string {
  const today = getZonedDateParts(new Date(), locale);

  if (!hasTagGoalInMonth(goals, today.year, today.month)) {
    return toMonthStartIso(today.year, today.month);
  }

  const nextTotal = today.year * 12 + today.month;
  const nextYear = Math.floor(nextTotal / 12);
  const nextMonth = (nextTotal % 12) + 1;

  return toMonthStartIso(nextYear, nextMonth);
}

export function previousTagGoalValue(goals: TagGoal[], startsOn: string, fallback: number | null): number | null {
  const startsOnTotal = yearMonthTotal(startsOn);

  if (startsOnTotal == null) return fallback;

  let previous: TagGoal | null = null;
  let previousTotal = Number.NEGATIVE_INFINITY;

  for (const goal of goals) {
    const total = yearMonthTotal(tagGoalStartsOn(goal));

    if (total == null || total > startsOnTotal) continue;

    if (total >= previousTotal) {
      previous = goal;
      previousTotal = total;
    }
  }

  return previous?.value ?? fallback;
}

export function wantsTagGoal(form: Pick<TagForm, 'goalStartsOn' | 'goalValue' | 'goalEndsOn'>): boolean {
  return Boolean(form.goalStartsOn) || form.goalValue != null || Boolean(form.goalEndsOn);
}

export function tagGoalWriteFields(
  form: Pick<TagForm, 'goalStartsOn' | 'goalValue' | 'goalEndsOn'>,
): Pick<TagCreatePayload['tag'], 'goalStartsOn' | 'goalValue' | 'goalEndsOn'> {
  const fields: Pick<TagCreatePayload['tag'], 'goalStartsOn' | 'goalValue' | 'goalEndsOn'> = {};

  if (form.goalStartsOn) {
    fields.goalStartsOn = monthStartFromIso(form.goalStartsOn) ?? form.goalStartsOn;
  }

  if (form.goalValue != null) {
    fields.goalValue = form.goalValue;
  }

  if (form.goalEndsOn) {
    fields.goalEndsOn = monthStartFromIso(form.goalEndsOn) ?? form.goalEndsOn;
  }

  return fields;
}
