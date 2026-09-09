import { describe, expect, it } from 'vitest';
import {
  blankValidator,
  confirmationValidator,
  emailValidator,
  formatValidator,
  isBlank,
  isValidEmail,
  maxLengthValidator,
  minLengthValidator,
} from '@/utils/validators';

describe('isBlank', () => {
  it('considera vazio null, undefined, string em branco e array vazio', () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank('')).toBe(true);
    expect(isBlank('   ')).toBe(true);
    expect(isBlank([])).toBe(true);
  });

  it('não considera vazio valores preenchidos', () => {
    expect(isBlank('ok')).toBe(false);
    expect(isBlank(0)).toBe(false);
    expect(isBlank(false)).toBe(false);
    expect(isBlank(['item'])).toBe(false);
  });
});

describe('blankValidator', () => {
  it('falha em branco e passa com valor', () => {
    expect(blankValidator('').isValid).toBe(false);
    expect(blankValidator('nome').isValid).toBe(true);
    expect(blankValidator('').errorMessage).toBe("can't be blank");
  });
});

describe('emailValidator', () => {
  it('aceita e-mail válido e ignora em branco', () => {
    expect(isValidEmail('ada@example.com')).toBe(true);
    expect(emailValidator('ada@example.com').isValid).toBe(true);
    expect(emailValidator('').isValid).toBe(true);
  });

  it('rejeita e-mail inválido', () => {
    expect(isValidEmail('ada@')).toBe(false);
    expect(emailValidator('ada@').isValid).toBe(false);
    expect(emailValidator('ada@').errorMessage).toBe('is invalid');
  });
});

describe('length validators', () => {
  it('ignora em branco e valida tamanho mínimo e máximo', () => {
    expect(minLengthValidator(3)('').isValid).toBe(true);
    expect(minLengthValidator(3)('ab').isValid).toBe(false);
    expect(minLengthValidator(3)('abc').isValid).toBe(true);
    expect(minLengthValidator(3)('ab').errorMessage).toBe('is too short (minimum is 3 characters)');

    expect(maxLengthValidator(3)('').isValid).toBe(true);
    expect(maxLengthValidator(3)('abcd').isValid).toBe(false);
    expect(maxLengthValidator(3)('abc').isValid).toBe(true);
    expect(maxLengthValidator(3)('abcd').errorMessage).toBe('is too long (maximum is 3 characters)');
  });
});

describe('confirmationValidator', () => {
  it('exige igualdade com o valor esperado', () => {
    const validator = confirmationValidator('secret', 'password');

    expect(validator('').isValid).toBe(true);
    expect(validator('secret').isValid).toBe(true);
    expect(validator('other').isValid).toBe(false);
    expect(validator('other').errorMessage).toBe("doesn't match password");
  });
});

describe('formatValidator', () => {
  it('valida o padrão ou usa a mensagem customizada', () => {
    const hex = formatValidator(/^#[0-9a-f]{6}$/i);

    expect(hex('').isValid).toBe(true);
    expect(hex('#aabbcc').isValid).toBe(true);
    expect(hex('red').isValid).toBe(false);
    expect(hex('red').errorMessage).toBe('is invalid');
    expect(formatValidator(/^\d+$/, 'must be numeric')('abc').errorMessage).toBe('must be numeric');
  });
});
