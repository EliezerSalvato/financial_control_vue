import type { GoalTarget, GoalTransaction } from '@/types/goal';
import { describe, expect, it } from 'vitest';
import { goalDiffClass, goalInstallmentLabel, goalRowClass, groupGoalsByKind } from '@/utils/goalGroups';

function target(overrides: Partial<GoalTarget> = {}): GoalTarget {
  return {
    id: 'cat-1',
    kind: 'category',
    name: 'Moradia',
    color: '#112233',
    value: 2000,
    ...overrides,
  };
}

function transaction(overrides: Partial<GoalTransaction> = {}): GoalTransaction {
  return {
    id: 'tx-1',
    kind: 'expense',
    description: 'Aluguel',
    recurrenceType: 'one_time',
    value: 1500,
    firstRecurrenceOn: '2026-09-05',
    currentRecurrenceOn: '2026-09-05',
    endsOn: null,
    categoryId: 'cat-1',
    tagIds: ['tag-1'],
    ...overrides,
  };
}

describe('groupGoalsByKind', () => {
  it('agrupa transações nas metas do tipo e ordena por nome', () => {
    const groups = groupGoalsByKind(
      'category',
      [target({ id: 'cat-2', name: 'Transporte', value: 400 }), target(), target({ id: 'tag-1', kind: 'tag', name: 'Casa', value: 1000 })],
      [
        transaction({ id: 'tx-2', description: 'Condomínio', value: 300, currentRecurrenceOn: '2026-09-10' }),
        transaction(),
        transaction({ id: 'tx-3', categoryId: 'cat-9', description: 'Outro', value: 50 }),
      ],
    );

    expect(groups.map((group) => group.id)).toEqual(['cat-1', 'cat-2']);
    expect(groups[0]).toMatchObject({
      name: 'Moradia',
      color: '#112233',
      goal: 2000,
      total: 1800,
      diff: 200,
      percent: 90,
      transactionKind: 'expense',
    });
    expect(groups[0]?.items.map((item) => item.description)).toEqual(['Aluguel', 'Condomínio']);
    expect(groups[1]).toMatchObject({ name: 'Transporte', total: 0, diff: 400, percent: 0 });
  });

  it('agrupa transações por tag mesmo quando a categoria é outra', () => {
    const groups = groupGoalsByKind(
      'tag',
      [target({ id: 'tag-1', kind: 'tag', name: 'Casa', value: 1000 })],
      [transaction({ tagIds: ['tag-1', 'tag-2'] }), transaction({ id: 'tx-2', tagIds: [] })],
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ total: 1500, diff: -500, percent: 150, transactionKind: 'expense' });
  });

  it('calcula a diferença como atual menos meta para receitas e transferências', () => {
    const income = groupGoalsByKind('category', [target()], [transaction({ kind: 'income', value: 2500 })]);
    const transfer = groupGoalsByKind('category', [target({ value: 1000 })], [transaction({ kind: 'transfer_between_accounts', value: 800 })]);

    expect(income[0]).toMatchObject({ total: 2500, diff: 500, percent: 125, transactionKind: 'income' });
    expect(transfer[0]).toMatchObject({ total: 800, diff: -200, percent: 80, transactionKind: 'transfer_between_accounts' });
  });
});

describe('goalRowClass', () => {
  it('pinta sucesso abaixo de 70%, aviso a partir de 70% e perigo a partir de 90% nas despesas', () => {
    expect(goalRowClass(null)).toBe('');
    expect(goalRowClass(0, 0)).toBe('');
    expect(goalRowClass(69.99, 100)).toBe('goal-color-success');
    expect(goalRowClass(70, 100)).toBe('goal-color-warning');
    expect(goalRowClass(89.99, 100)).toBe('goal-color-warning');
    expect(goalRowClass(90, 100)).toBe('goal-color-danger');
  });

  it('inverte as cores para receitas e transferências', () => {
    expect(goalRowClass(0, 0, 'income')).toBe('');
    expect(goalRowClass(69.99, 100, 'income')).toBe('goal-color-danger');
    expect(goalRowClass(70, 100, 'income')).toBe('goal-color-warning');
    expect(goalRowClass(89.99, 100, 'transfer_between_accounts')).toBe('goal-color-warning');
    expect(goalRowClass(90, 100, 'income')).toBe('goal-color-success');
  });
});

describe('goalDiffClass', () => {
  it('marca diferença negativa nas despesas e positiva nas receitas', () => {
    expect(goalDiffClass(-1)).toBe('goal-diff-negative');
    expect(goalDiffClass(0)).toBe('');
    expect(goalDiffClass(1)).toBe('');
    expect(goalDiffClass(1, 'income')).toBe('goal-diff-positive');
    expect(goalDiffClass(0, 'income')).toBe('');
    expect(goalDiffClass(-1, 'transfer_between_accounts')).toBe('');
  });
});

describe('goalInstallmentLabel', () => {
  it('não rotula transação à vista', () => {
    expect(goalInstallmentLabel(transaction())).toBe('');
  });

  it('conta o mês atual e o total da parcela', () => {
    expect(
      goalInstallmentLabel(
        transaction({
          recurrenceType: 'installment',
          firstRecurrenceOn: '2026-01-10',
          currentRecurrenceOn: '2026-03-10',
          endsOn: '2026-04-10',
        }),
      ),
    ).toBe(' - 3/4');
  });

  it('usa infinito quando a recorrência não tem data final', () => {
    expect(
      goalInstallmentLabel(
        transaction({
          recurrenceType: 'recurring',
          firstRecurrenceOn: '2026-01-10',
          currentRecurrenceOn: '2026-09-10',
        }),
      ),
    ).toBe(' - 9/∞');
  });
});
