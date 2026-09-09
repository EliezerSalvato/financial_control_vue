import type { InvoiceSettlementResourceItemApi } from '@/types/credit_card';
import { describe, expect, it } from 'vitest';
import { invoiceSettlementCollectionFromApi, invoiceSettlementFromResource } from '@/transformers/credit_card';

const resource: InvoiceSettlementResourceItemApi = {
  id: 'inv-1',
  type: 'credit_card_invoice_settlement',
  attributes: {
    id: 'inv-1',
    creditCardId: 'cc-1',
    paymentAccountId: 'acc-1',
    openingDate: '2026-08-11',
    closingDate: '2026-09-10',
    dueDate: '2026-09-17',
    totalValue: '1234.56',
    releasedLimit: '500.00',
    settledOn: '2026-09-17',
  },
};

describe('invoiceSettlementFromResource', () => {
  it('converte valores decimais e mapeia o recurso', () => {
    expect(invoiceSettlementFromResource(resource)).toEqual({
      id: 'inv-1',
      creditCardId: 'cc-1',
      paymentAccountId: 'acc-1',
      openingDate: '2026-08-11',
      closingDate: '2026-09-10',
      dueDate: '2026-09-17',
      totalValue: 1234.56,
      releasedLimit: 500,
      settledOn: '2026-09-17',
    });
  });

  it('usa o id do recurso e zero quando os valores não são numéricos', () => {
    expect(
      invoiceSettlementFromResource({
        ...resource,
        id: 'fallback-id',
        attributes: {
          ...resource.attributes,
          id: undefined as unknown as string,
          totalValue: '',
          releasedLimit: 'not-a-number',
        },
      }),
    ).toMatchObject({
      id: 'fallback-id',
      totalValue: 0,
      releasedLimit: 0,
    });
  });

  it('normaliza chaves snake_case vindas da API', () => {
    const invoice = invoiceSettlementFromResource({
      ...resource,
      attributes: {
        ...resource.attributes,
        credit_card_id: 'cc-9',
        payment_account_id: 'acc-9',
        total_value: 10,
        released_limit: 2,
      } as InvoiceSettlementResourceItemApi['attributes'],
    });

    expect(invoice.creditCardId).toBe('cc-9');
    expect(invoice.paymentAccountId).toBe('acc-9');
    expect(invoice.totalValue).toBe(10);
    expect(invoice.releasedLimit).toBe(2);
  });
});

describe('invoiceSettlementCollectionFromApi', () => {
  it('mapeia a coleção', () => {
    expect(
      invoiceSettlementCollectionFromApi({
        status: 'success',
        type: 'collection',
        data: [resource],
      }),
    ).toEqual({
      invoiceSettlements: [invoiceSettlementFromResource(resource)],
    });
  });
});
