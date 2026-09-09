import { afterEach, describe, expect, it } from 'vitest';
import { getCookie, setCookie } from '@/utils/cookies';

describe('cookies', () => {
  afterEach(() => {
    document.cookie.split('; ').forEach((entry) => {
      const name = entry.split('=')[0];
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  });

  it('grava e lê o valor, inclusive com caracteres especiais', () => {
    setCookie('locale', 'pt-BR', 'Fri, 31 Dec 9999 23:59:59 GMT');
    expect(getCookie('locale')).toBe('pt-BR');

    setCookie('note', 'a=b c', 'Fri, 31 Dec 9999 23:59:59 GMT');
    expect(getCookie('note')).toBe('a=b c');
  });

  it('devolve null quando o cookie não existe', () => {
    expect(getCookie('missing')).toBeNull();
  });
});
