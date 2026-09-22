import type { TransactionKind } from '@/types/transaction';
import type { GoalTarget, GoalTargetKind, GoalTransaction } from '@/types/goal';
import { monthsBetweenInclusive } from '@/utils/isoDate';

export type GoalGroup = {
  id: string;
  name: string;
  color: string;
  goal: number;
  total: number;
  diff: number;
  percent: number | null;
  transactionKind: TransactionKind;
  items: GoalTransaction[];
};

function usesAttainmentRules(kind: TransactionKind): boolean {
  return kind === 'income' || kind === 'transfer_between_accounts';
}

function groupTransactionKind(items: GoalTransaction[]): TransactionKind {
  return items[0]?.kind ?? 'expense';
}

function belongsToTarget(item: GoalTransaction, target: GoalTarget): boolean {
  if (target.kind === 'category') return item.categoryId === target.id;

  return item.tagIds.includes(target.id);
}

export function groupGoalsByKind(kind: GoalTargetKind, targets: GoalTarget[], transactions: GoalTransaction[]): GoalGroup[] {
  return targets
    .filter((target) => target.kind === kind)
    .map((target) => {
      const items = transactions
        .filter((item) => belongsToTarget(item, target))
        .sort(
          (left, right) => left.currentRecurrenceOn.localeCompare(right.currentRecurrenceOn) || left.description.localeCompare(right.description),
        );
      const total = items.reduce((sum, item) => sum + item.value, 0);
      const transactionKind = groupTransactionKind(items);

      return {
        id: target.id,
        name: target.name,
        color: target.color,
        goal: target.value,
        total,
        diff: usesAttainmentRules(transactionKind) ? total - target.value : target.value - total,
        percent: target.value ? (total / target.value) * 100 : null,
        transactionKind,
        items,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function goalRowClass(percent: number | null, total = 0, kind: TransactionKind = 'expense'): string {
  if (percent == null || total === 0) return '';

  if (usesAttainmentRules(kind)) {
    if (percent < 70) return 'goal-color-danger';

    if (percent < 90) return 'goal-color-warning';

    return 'goal-color-success';
  }

  if (percent >= 90) return 'goal-color-danger';

  if (percent >= 70) return 'goal-color-warning';

  return 'goal-color-success';
}

export function goalDiffClass(diff: number, kind: TransactionKind = 'expense'): string {
  if (usesAttainmentRules(kind)) return diff > 0 ? 'goal-diff-positive' : '';

  return diff < 0 ? 'goal-diff-negative' : '';
}

export function goalInstallmentLabel(item: Pick<GoalTransaction, 'recurrenceType' | 'firstRecurrenceOn' | 'currentRecurrenceOn' | 'endsOn'>): string {
  if (item.recurrenceType === 'one_time') return '';

  const current = monthsBetweenInclusive(item.firstRecurrenceOn, item.currentRecurrenceOn);

  if (current == null) return '';

  if (!item.endsOn) return ` - ${current}/∞`;

  const total = monthsBetweenInclusive(item.firstRecurrenceOn, item.endsOn);

  if (total == null) return '';

  return ` - ${Math.min(current, total)}/${total}`;
}
