import { describe, expect, it } from 'vitest';
import { toDecimal } from '@/utils/number';

describe('toDecimal', () => {
  it('converte string e número finito', () => {
    expect(toDecimal('150.50')).toBe(150.5);
    expect(toDecimal(10)).toBe(10);
    expect(toDecimal(0)).toBe(0);
  });

  it('trata vazio e inválido como zero', () => {
    expect(toDecimal(null)).toBe(0);
    expect(toDecimal(undefined)).toBe(0);
    expect(toDecimal('')).toBe(0);
    expect(toDecimal('not-a-number')).toBe(0);
    expect(toDecimal(Number.NaN)).toBe(0);
    expect(toDecimal(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
