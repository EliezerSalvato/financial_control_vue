import type { InvoiceSettlement } from '@/types/credit_card';
import { describe, expect, it } from 'vitest';
import { settledOnForInvoice } from '@/utils/settledInvoice';

function invoice(overrides: Partial<InvoiceSettlement> = {}): InvoiceSettlement {
  return {
    id: 'inv-1',
    creditCardId: 'cc-1',
    paymentAccountId: 'acc-1',
    openingDate: '2026-08-11',
    closingDate: '2026-09-10',
    dueDate: '2026-09-17',
    totalValue: 500,
    releasedLimit: 500,
    settledOn: '2026-09-12',
    ...overrides,
  };
}

const group = {
  resourceId: 'cc-1',
  openingDate: '2026-08-11T00:00:00.000Z',
  closingDate: '2026-09-10T00:00:00.000Z',
  dueDate: '2026-09-17T00:00:00.000Z',
};

describe('settledOnForInvoice', () => {
  it('casa cartão, abertura, fechamento e vencimento', () => {
    expect(settledOnForInvoice([invoice()], group)).toBe('2026-09-12');
  });

  it('ignora faturas de outro cartão ou ciclo', () => {
    expect(settledOnForInvoice([invoice({ creditCardId: 'cc-other' })], group)).toBeUndefined();
    expect(settledOnForInvoice([invoice({ openingDate: '2026-07-11' })], group)).toBeUndefined();
    expect(settledOnForInvoice([invoice({ closingDate: '2026-08-10' })], group)).toBeUndefined();
    expect(settledOnForInvoice([invoice({ dueDate: '2026-09-20' })], group)).toBeUndefined();
  });

  it('não exige vencimento quando o grupo não tem dueDate', () => {
    expect(
      settledOnForInvoice([invoice({ dueDate: '2026-09-20' })], {
        ...group,
        dueDate: null,
      }),
    ).toBe('2026-09-12');
  });
});
