import { describe, expect, it } from 'vitest';
import { formatCurrency, signedAmountClass } from '@/utils/money';

function normalizeMoney(value: string) {
  return value.replace(/\u00a0|\u202f/g, ' ');
}

describe('formatCurrency', () => {
  it('formata conforme o locale da aplicação', () => {
    expect(normalizeMoney(formatCurrency(10, 'en'))).toBe('$10.00');
    expect(normalizeMoney(formatCurrency(10, 'pt-BR'))).toMatch(/^R\$\s?10,00$/);
  });

  it('cai para o locale padrão quando o informado não é suportado', () => {
    expect(normalizeMoney(formatCurrency(1, 'fr'))).toBe('$1.00');
  });
});

describe('signedAmountClass', () => {
  it('marca positivo, negativo e zero', () => {
    expect(signedAmountClass(12.5)).toBe('has-text-success');
    expect(signedAmountClass(-0.01)).toBe('has-text-danger');
    expect(signedAmountClass(0)).toBeUndefined();
  });
});
