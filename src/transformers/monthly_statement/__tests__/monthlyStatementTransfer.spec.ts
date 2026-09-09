import type { MonthlyStatementTransferResourceItemApi } from '@/types/monthly_statement';
import { describe, expect, it } from 'vitest';
import { monthlyStatementTransferCollectionFromApi, monthlyStatementTransferFromResource } from '@/transformers/monthly_statement';

function resource(value: string | number | null, extras: Record<string, unknown> = {}): MonthlyStatementTransferResourceItemApi {
  return {
    id: 'tr-1',
    type: 'monthly_statement_transfer',
    attributes: {
      id: 'tr-1',
      kind: 'transfer_between_accounts',
      description: 'Reserva',
      recurrenceType: 'one_time',
      sourceAccountId: 'acc-src',
      sourceAccountName: 'Nubank',
      sourceAccountBrand: 'nubank',
      destinationAccountId: 'acc-dst',
      destinationAccountName: 'Inter',
      destinationAccountBrand: 'inter',
      openingDate: '2026-09-01',
      closingDate: '2026-09-30',
      value,
      firstRecurrenceOn: '2026-09-05',
      currentRecurrenceOn: '2026-09-05',
      startsOn: '2026-09-05',
      endsOn: null,
      canceledOn: null,
      ...extras,
    },
  } as MonthlyStatementTransferResourceItemApi;
}

describe('monthlyStatementTransferFromResource', () => {
  it('converte valor decimal e nulos opcionais', () => {
    expect(monthlyStatementTransferFromResource(resource('80.25'))).toMatchObject({
      id: 'tr-1',
      value: 80.25,
      sourceAccountBrand: 'nubank',
      destinationAccountBrand: 'inter',
      endsOn: null,
      canceledOn: null,
    });

    expect(monthlyStatementTransferFromResource(resource(10)).value).toBe(10);
    expect(monthlyStatementTransferFromResource(resource(null)).value).toBe(0);
    expect(monthlyStatementTransferFromResource(resource('')).value).toBe(0);
  });

  it('usa o id do recurso e trata marcas ausentes', () => {
    expect(
      monthlyStatementTransferFromResource({
        ...resource(20),
        id: 'fallback-id',
        attributes: {
          ...resource(20).attributes,
          id: undefined as unknown as string,
          sourceAccountBrand: undefined,
          destinationAccountBrand: undefined,
          endsOn: '2026-12-01',
          canceledOn: '2026-11-01',
        },
      }),
    ).toMatchObject({
      id: 'fallback-id',
      sourceAccountBrand: null,
      destinationAccountBrand: null,
      endsOn: '2026-12-01',
      canceledOn: '2026-11-01',
    });
  });

  it('normaliza chaves snake_case vindas da API', () => {
    const transfer = monthlyStatementTransferFromResource({
      ...resource(20),
      attributes: {
        ...resource(20).attributes,
        source_account_id: 'acc-a',
        source_account_name: 'Fonte',
        destination_account_id: 'acc-b',
        destination_account_name: 'Destino',
      } as MonthlyStatementTransferResourceItemApi['attributes'],
    });

    expect(transfer.sourceAccountId).toBe('acc-a');
    expect(transfer.sourceAccountName).toBe('Fonte');
    expect(transfer.destinationAccountId).toBe('acc-b');
    expect(transfer.destinationAccountName).toBe('Destino');
  });
});

describe('monthlyStatementTransferCollectionFromApi', () => {
  it('mapeia a coleção', () => {
    expect(
      monthlyStatementTransferCollectionFromApi({
        status: 'success',
        type: 'collection',
        data: [resource(1)],
      }),
    ).toEqual({
      monthlyStatementTransfers: [monthlyStatementTransferFromResource(resource(1))],
    });
  });
});
