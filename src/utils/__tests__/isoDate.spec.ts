import { describe, expect, it } from 'vitest';
import {
  addDaysToIsoDate,
  addMonthsToIsoDate,
  formatMonthYear,
  makeIsoDateClamped,
  monthStartFromIso,
  monthsBetweenInclusive,
  parseIsoDate,
  shiftYearMonth,
  toIsoDate,
  toMonthStartIso,
  yearMonthTotal,
} from '@/utils/isoDate';

describe('parseIsoDate', () => {
  it('lê ano, mês e dia de um ISO válido', () => {
    expect(parseIsoDate('2026-03-15')).toEqual({ year: 2026, month: 3, day: 15 });
    expect(parseIsoDate('2026-03-15T12:00:00.000Z')).toEqual({ year: 2026, month: 3, day: 15 });
  });

  it('rejeita valores inválidos e meses fora de 1–12', () => {
    expect(parseIsoDate('')).toBeNull();
    expect(parseIsoDate('2026/03/15')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('2026-00-01')).toBeNull();
  });
});

describe('toIsoDate / makeIsoDateClamped', () => {
  it('preenche com zeros à esquerda', () => {
    expect(toIsoDate(2026, 3, 5)).toBe('2026-03-05');
    expect(toMonthStartIso(2026, 7)).toBe('2026-07-01');
    expect(monthStartFromIso('2026-07-31')).toBe('2026-07-01');
    expect(formatMonthYear(2026, 7)).toBe('07/2026');
  });

  it('limita o dia ao último do mês, inclusive em ano bissexto', () => {
    expect(makeIsoDateClamped(2026, 1, 31)).toBe('2026-01-31');
    expect(makeIsoDateClamped(2026, 2, 31)).toBe('2026-02-28');
    expect(makeIsoDateClamped(2024, 2, 31)).toBe('2024-02-29');
  });
});

describe('shiftYearMonth', () => {
  it('avança e recua meses cruzando o ano', () => {
    expect(shiftYearMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftYearMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftYearMonth(2026, 6, 0)).toEqual({ year: 2026, month: 6 });
  });
});

describe('addDaysToIsoDate', () => {
  it('avança dias cruzando mês e ano', () => {
    expect(addDaysToIsoDate('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysToIsoDate('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('devolve null quando a data é inválida', () => {
    expect(addDaysToIsoDate('invalid', 1)).toBeNull();
  });
});

describe('yearMonthTotal / monthsBetweenInclusive', () => {
  it('conta meses inclusivos no mesmo mês e em intervalos', () => {
    expect(monthsBetweenInclusive('2026-01-31', '2026-01-01')).toBe(1);
    expect(monthsBetweenInclusive('2026-01-15', '2026-04-01')).toBe(4);
  });

  it('ignora datas inválidas e intervalos invertidos', () => {
    expect(yearMonthTotal('bad')).toBeNull();
    expect(monthsBetweenInclusive('2026-04-01', '2026-01-15')).toBeNull();
    expect(monthsBetweenInclusive('bad', '2026-01-01')).toBeNull();
  });
});

describe('addMonthsToIsoDate', () => {
  it('preserva o dia quando o mês destino cabe, senão limita', () => {
    expect(addMonthsToIsoDate('2026-01-15', 12)).toBe('2027-01-15');
    expect(addMonthsToIsoDate('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('devolve o valor original quando a data é inválida', () => {
    expect(addMonthsToIsoDate('not-iso', 1)).toBe('not-iso');
  });
});
