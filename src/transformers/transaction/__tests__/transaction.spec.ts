import type {
  TransactionAttributesApi,
  TransactionCollectionResponseApi,
  TransactionCreateResponseApi,
  TransactionRecurrenceResourceItemApi,
  TransactionResourceItemApi,
} from '@/types/transaction';
import { describe, expect, it } from 'vitest';
import { transactionCollectionFromApi, transactionCreateFromApi, transactionFromResource, transactionShowFromApi } from '@/transformers/transaction';

function recurrence(id: string, startsOn: string, value: string | number): TransactionRecurrenceResourceItemApi {
  return {
    id,
    type: 'transaction_recurrence',
    attributes: { id, startsOn, value },
  };
}

const resource: TransactionResourceItemApi = {
  id: 'tx-1',
  type: 'transaction',
  attributes: {
    id: 'tx-1',
    categoryId: 'cat-1',
    description: 'Aluguel',
    kind: 'expense',
    status: 'active',
    paymentMethod: 'pix',
    recurrenceType: 'recurring',
    installmentsCount: null,
    endsOn: '2026-12-05',
    accountId: 'acc-1',
    creditCardId: null,
    limitConsumptionType: null,
    sourceAccountId: null,
    destinationAccountId: null,
    tagIds: ['tag-1'],
    currentValue: '1200.50',
    recurrences: [recurrence('rec-2', '2026-06-05', '1300'), recurrence('rec-1', '2026-01-05', '1200')],
  },
};

describe('transactionFromResource', () => {
  it('ordena recorrências e deriva valor e data da primeira', () => {
    expect(transactionFromResource(resource)).toEqual({
      id: 'tx-1',
      categoryId: 'cat-1',
      description: 'Aluguel',
      kind: 'expense',
      status: 'active',
      paymentMethod: 'pix',
      recurrenceType: 'recurring',
      installmentsCount: null,
      endsOn: '2026-12-05',
      accountId: 'acc-1',
      creditCardId: null,
      limitConsumptionType: null,
      sourceAccountId: null,
      destinationAccountId: null,
      tagIds: ['tag-1'],
      recurrences: [
        { id: 'rec-1', startsOn: '2026-01-05', value: 1200 },
        { id: 'rec-2', startsOn: '2026-06-05', value: 1300 },
      ],
      value: 1200,
      currentValue: 1200.5,
      startsOn: '2026-01-05',
    });
  });

  it('usa fallbacks quando campos opcionais e recorrências faltam', () => {
    expect(
      transactionFromResource({
        ...resource,
        id: 'fallback-id',
        attributes: {
          description: 'À vista',
          kind: 'income',
          status: 'pending',
          recurrenceType: 'one_time',
        } as TransactionAttributesApi,
      }),
    ).toEqual({
      id: 'fallback-id',
      categoryId: null,
      description: 'À vista',
      kind: 'income',
      status: 'pending',
      paymentMethod: null,
      recurrenceType: 'one_time',
      installmentsCount: null,
      endsOn: null,
      accountId: null,
      creditCardId: null,
      limitConsumptionType: null,
      sourceAccountId: null,
      destinationAccountId: null,
      tagIds: [],
      recurrences: [],
      value: 0,
      currentValue: 0,
      startsOn: null,
    });
  });

  it('cai no valor da primeira recorrência quando currentValue não vem', () => {
    expect(
      transactionFromResource({
        ...resource,
        attributes: {
          ...resource.attributes,
          currentValue: undefined,
          recurrences: [recurrence('rec-1', '2026-01-05', '99.9')],
        },
      }).currentValue,
    ).toBe(99.9);
  });
});

describe('transaction collection / show / create', () => {
  it('inclui paginação na listagem', () => {
    const response: TransactionCollectionResponseApi = {
      status: 'success',
      type: 'collection',
      data: [resource],
      meta: {
        page: 2,
        per_page: 10,
        count: 11,
        pages: 2,
        next_page: null,
        prev_page: 1,
      },
    };

    expect(transactionCollectionFromApi(response)).toEqual({
      transactions: [transactionFromResource(resource)],
      pagination: {
        currentPage: 2,
        prevPage: 1,
        nextPage: null,
        totalPages: 2,
        totalCount: 11,
        offsetValue: 10,
        size: 1,
      },
    });
  });

  it('devolve a transação no show e a mensagem no create', () => {
    const created: TransactionCreateResponseApi = {
      status: 'success',
      type: 'object',
      message: 'Transaction created',
      data: resource,
    };

    expect(transactionShowFromApi(created)).toEqual(transactionFromResource(resource));
    expect(transactionCreateFromApi(created)).toEqual({
      message: 'Transaction created',
      transaction: transactionFromResource(resource),
    });
  });
});
