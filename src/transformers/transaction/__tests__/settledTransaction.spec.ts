import type { SettledTransactionAttributesApi, SettledTransactionResourceItemApi } from '@/types/transaction';
import { describe, expect, it } from 'vitest';
import { settledTransactionCollectionFromApi, settledTransactionFromResource } from '@/transformers/transaction';

const resource: SettledTransactionResourceItemApi = {
  id: 'st-1',
  type: 'settled_transaction',
  attributes: {
    id: 'st-1',
    transactionId: 'tx-1',
    categoryId: 'cat-1',
    description: 'Aluguel',
    kind: 'expense',
    status: 'active',
    paymentMethod: 'pix',
    recurrenceType: 'one_time',
    installmentsCount: 1,
    endsOn: '2026-09-05',
    canceledOn: null,
    occurredOn: '2026-09-05',
    settledOn: '2026-09-06',
    value: '150.50',
    installmentNumber: 1,
    accountId: 'acc-1',
    creditCardId: null,
    limitConsumptionType: null,
    sourceAccountId: null,
    destinationAccountId: null,
  },
};

describe('settledTransactionFromResource', () => {
  it('converte valor decimal e mapeia o recurso', () => {
    expect(settledTransactionFromResource(resource)).toEqual({
      id: 'st-1',
      transactionId: 'tx-1',
      categoryId: 'cat-1',
      description: 'Aluguel',
      kind: 'expense',
      status: 'active',
      paymentMethod: 'pix',
      recurrenceType: 'one_time',
      installmentsCount: 1,
      endsOn: '2026-09-05',
      canceledOn: null,
      occurredOn: '2026-09-05',
      settledOn: '2026-09-06',
      value: 150.5,
      installmentNumber: 1,
      accountId: 'acc-1',
      creditCardId: null,
      limitConsumptionType: null,
      sourceAccountId: null,
      destinationAccountId: null,
    });
  });

  it('usa o id do recurso e nulos quando atributos opcionais faltam', () => {
    expect(
      settledTransactionFromResource({
        ...resource,
        id: 'fallback-id',
        attributes: {
          transactionId: 'tx-2',
          description: 'Transferência',
          kind: 'transfer_between_accounts',
          status: 'completed',
          recurrenceType: 'one_time',
          occurredOn: '2026-09-01',
          settledOn: '2026-09-01',
          value: '',
        } as SettledTransactionAttributesApi,
      }),
    ).toEqual({
      id: 'fallback-id',
      transactionId: 'tx-2',
      categoryId: null,
      description: 'Transferência',
      kind: 'transfer_between_accounts',
      status: 'completed',
      paymentMethod: null,
      recurrenceType: 'one_time',
      installmentsCount: null,
      endsOn: null,
      canceledOn: null,
      occurredOn: '2026-09-01',
      settledOn: '2026-09-01',
      value: 0,
      installmentNumber: null,
      accountId: null,
      creditCardId: null,
      limitConsumptionType: null,
      sourceAccountId: null,
      destinationAccountId: null,
    });
  });

  it('normaliza chaves snake_case vindas da API', () => {
    const settled = settledTransactionFromResource({
      ...resource,
      attributes: {
        ...resource.attributes,
        transaction_id: 'tx-9',
        source_account_id: 'acc-src',
        destination_account_id: 'acc-dst',
      } as SettledTransactionResourceItemApi['attributes'],
    });

    expect(settled.transactionId).toBe('tx-9');
    expect(settled.sourceAccountId).toBe('acc-src');
    expect(settled.destinationAccountId).toBe('acc-dst');
  });
});

describe('settledTransactionCollectionFromApi', () => {
  it('mapeia a coleção', () => {
    expect(
      settledTransactionCollectionFromApi({
        status: 'success',
        type: 'collection',
        data: [resource],
      }),
    ).toEqual({
      settledTransactions: [settledTransactionFromResource(resource)],
    });
  });
});
