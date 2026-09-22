import type { GoalTransactionResourceItemApi } from '@/types/goal';
import { describe, expect, it } from 'vitest';
import { goalTransactionCollectionFromApi, goalTransactionFromResource } from '@/transformers/goal';

function resource(value: string | number | null, extras: Record<string, unknown> = {}): GoalTransactionResourceItemApi {
  return {
    id: 'goal-tx-1',
    type: 'goal_transaction',
    attributes: {
      id: 'goal-tx-1',
      kind: 'expense',
      description: 'Aluguel',
      recurrenceType: 'one_time',
      value,
      firstRecurrenceOn: '2026-09-05',
      currentRecurrenceOn: '2026-09-05',
      endsOn: null,
      categoryId: 'cat-1',
      tagIds: ['tag-1'],
      ...extras,
    },
  } as GoalTransactionResourceItemApi;
}

describe('goalTransactionFromResource', () => {
  it('converte valor decimal e nulos opcionais', () => {
    expect(goalTransactionFromResource(resource('150.50'))).toMatchObject({
      id: 'goal-tx-1',
      value: 150.5,
      endsOn: null,
      categoryId: 'cat-1',
      tagIds: ['tag-1'],
    });

    expect(goalTransactionFromResource(resource(10)).value).toBe(10);
    expect(goalTransactionFromResource(resource(null)).value).toBe(0);
    expect(goalTransactionFromResource(resource('')).value).toBe(0);
    expect(
      goalTransactionFromResource(
        resource(20, {
          endsOn: undefined,
          categoryId: undefined,
          tagIds: undefined,
        }),
      ),
    ).toMatchObject({
      endsOn: null,
      categoryId: null,
      tagIds: [],
    });
  });

  it('normaliza chaves snake_case vindas da API', () => {
    const transaction = goalTransactionFromResource({
      ...resource(20),
      attributes: {
        ...resource(20).attributes,
        recurrence_type: 'installment',
        first_recurrence_on: '2026-01-10',
        current_recurrence_on: '2026-09-10',
        category_id: 'cat-9',
        tag_ids: ['tag-2', 'tag-3'],
      } as GoalTransactionResourceItemApi['attributes'],
    });

    expect(transaction.recurrenceType).toBe('installment');
    expect(transaction.firstRecurrenceOn).toBe('2026-01-10');
    expect(transaction.currentRecurrenceOn).toBe('2026-09-10');
    expect(transaction.categoryId).toBe('cat-9');
    expect(transaction.tagIds).toEqual(['tag-2', 'tag-3']);
  });
});

describe('goalTransactionCollectionFromApi', () => {
  it('mapeia a coleção', () => {
    expect(goalTransactionCollectionFromApi({ status: 'success', type: 'collection', data: [resource(1)] })).toEqual({
      goalTransactions: [goalTransactionFromResource(resource(1))],
    });
  });
});
