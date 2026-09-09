import type { MonthlyStatementResourceItemApi } from '@/types/monthly_statement';
import { describe, expect, it } from 'vitest';
import { monthlyStatementCollectionFromApi, monthlyStatementFromResource } from '@/transformers/monthly_statement';

function resource(value: string | number | null, extras: Record<string, unknown> = {}): MonthlyStatementResourceItemApi {
  return {
    id: 'ms-1',
    type: 'monthly_statement',
    attributes: {
      id: 'ms-1',
      kind: 'expense',
      description: 'Aluguel',
      paymentMethod: 'account',
      resourceId: 'acc-1',
      resourceName: 'Nubank',
      resourceBrand: 'nubank',
      openingDate: '2026-09-01',
      closingDate: '2026-09-30',
      dueDate: null,
      value,
      recurrenceType: 'one_time',
      firstRecurrenceOn: '2026-09-05',
      currentRecurrenceOn: '2026-09-05',
      startsOn: '2026-09-05',
      endsOn: null,
      canceledOn: null,
      ...extras,
    },
  } as MonthlyStatementResourceItemApi;
}

describe('monthlyStatementFromResource', () => {
  it('converte valor decimal e nulos opcionais', () => {
    expect(monthlyStatementFromResource(resource('150.50'))).toMatchObject({
      id: 'ms-1',
      value: 150.5,
      resourceBrand: 'nubank',
      dueDate: null,
      endsOn: null,
      canceledOn: null,
    });

    expect(monthlyStatementFromResource(resource(10)).value).toBe(10);
    expect(monthlyStatementFromResource(resource(null)).value).toBe(0);
    expect(monthlyStatementFromResource(resource('')).value).toBe(0);
    expect(monthlyStatementFromResource(resource('not-a-number')).value).toBe(0);
  });

  it('normaliza chaves snake_case vindas da API', () => {
    const statement = monthlyStatementFromResource({
      ...resource(20),
      attributes: {
        ...resource(20).attributes,
        payment_method: 'credit_card',
        resource_id: 'cc-1',
        resource_name: 'Visa',
        resource_brand: null,
      } as MonthlyStatementResourceItemApi['attributes'],
    });

    expect(statement.paymentMethod).toBe('credit_card');
    expect(statement.resourceId).toBe('cc-1');
    expect(statement.resourceName).toBe('Visa');
    expect(statement.resourceBrand).toBeNull();
  });
});

describe('monthlyStatementCollectionFromApi', () => {
  it('mapeia a coleção', () => {
    expect(monthlyStatementCollectionFromApi({ status: 'success', type: 'collection', data: [resource(1)] })).toEqual({
      monthlyStatements: [monthlyStatementFromResource(resource(1))],
    });
  });
});
