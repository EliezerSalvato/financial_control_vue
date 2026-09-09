import type { SettledTransaction } from '@/types/transaction';
import { describe, expect, it } from 'vitest';
import { settledOnForOccurrence, toDateKey, uniqueYearMonths, yearMonthFromIso } from '@/utils/settledOccurrence';

function settled(overrides: Partial<SettledTransaction> = {}): SettledTransaction {
  return {
    id: 'st-1',
    transactionId: 'tx-1',
    categoryId: null,
    description: 'Aluguel',
    kind: 'expense',
    status: 'completed',
    paymentMethod: 'pix',
    recurrenceType: 'one_time',
    installmentsCount: null,
    endsOn: null,
    canceledOn: null,
    occurredOn: '2026-09-01',
    settledOn: '2026-09-02',
    value: 100,
    installmentNumber: null,
    accountId: 'acc-1',
    creditCardId: null,
    limitConsumptionType: null,
    sourceAccountId: null,
    destinationAccountId: null,
    ...overrides,
  };
}

describe('toDateKey', () => {
  it('corta datetime ISO para YYYY-MM-DD', () => {
    expect(toDateKey('2026-09-09T15:30:00.000Z')).toBe('2026-09-09');
    expect(toDateKey('2026-09-09')).toBe('2026-09-09');
  });

  it('trata valores vazios como string vazia', () => {
    expect(toDateKey(null)).toBe('');
    expect(toDateKey(undefined)).toBe('');
  });
});

describe('yearMonthFromIso', () => {
  it('extrai ano e mês válidos', () => {
    expect(yearMonthFromIso('2026-09-09')).toEqual({ year: 2026, month: 9 });
    expect(yearMonthFromIso('2026-09')).toEqual({ year: 2026, month: 9 });
  });

  it('ignora valores inválidos', () => {
    expect(yearMonthFromIso(null)).toBeNull();
    expect(yearMonthFromIso('not-a-date')).toBeNull();
    expect(yearMonthFromIso('2026-13-01')).toBeNull();
    expect(yearMonthFromIso('2026-00-01')).toBeNull();
  });
});

describe('uniqueYearMonths', () => {
  it('inclui o fallback primeiro e ignora duplicatas e inválidos', () => {
    expect(uniqueYearMonths(['2026-02-10', 'invalid', '2026-02-28', '2026-03-01'], { year: 2026, month: 1 })).toEqual([
      { year: 2026, month: 1 },
      { year: 2026, month: 2 },
      { year: 2026, month: 3 },
    ]);
  });
});

describe('settledOnForOccurrence', () => {
  it('prioriza a ocorrência na data exata', () => {
    const settledOn = settledOnForOccurrence(
      [
        settled({ id: 'window', occurredOn: '2026-09-05', settledOn: '2026-09-06' }),
        settled({ id: 'exact', occurredOn: '2026-09-10', settledOn: '2026-09-11' }),
      ],
      {
        id: 'tx-1',
        currentRecurrenceOn: '2026-09-10T12:00:00.000Z',
        openingDate: '2026-09-01',
        closingDate: '2026-09-30',
      },
    );

    expect(settledOn).toBe('2026-09-11');
  });

  it('cai no intervalo de abertura/fechamento quando não há data exata', () => {
    const settledOn = settledOnForOccurrence([settled({ occurredOn: '2026-09-20', settledOn: '2026-09-21' })], {
      id: 'tx-1',
      currentRecurrenceOn: '2026-09-10',
      openingDate: '2026-09-01',
      closingDate: '2026-09-30',
    });

    expect(settledOn).toBe('2026-09-21');
  });

  it('não usa o intervalo de outra transação nem fora das datas', () => {
    expect(
      settledOnForOccurrence([settled({ transactionId: 'tx-other', occurredOn: '2026-09-10' })], {
        id: 'tx-1',
        currentRecurrenceOn: '2026-09-10',
      }),
    ).toBeUndefined();

    expect(
      settledOnForOccurrence([settled({ occurredOn: '2026-10-01', settledOn: '2026-10-02' })], {
        id: 'tx-1',
        currentRecurrenceOn: '2026-09-10',
        openingDate: '2026-09-01',
        closingDate: '2026-09-30',
      }),
    ).toBeUndefined();
  });
});
