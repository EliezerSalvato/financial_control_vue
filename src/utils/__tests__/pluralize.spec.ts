import { describe, expect, it } from 'vitest';
import { pluralize } from '@/utils/pluralize';

describe('pluralize', () => {
  it('pluraliza inglês', () => {
    expect(pluralize('tag', 'en')).toBe('tags');
    expect(pluralize('category', 'en')).toBe('categories');
    expect(pluralize('box', 'en')).toBe('boxes');
    expect(pluralize('church', 'en')).toBe('churches');
  });

  it('pluraliza português, inclusive compostos', () => {
    expect(pluralize('tag', 'pt-BR')).toBe('tags');
    expect(pluralize('cartão', 'pt-BR')).toBe('cartões');
    expect(pluralize('cartão de crédito', 'pt-BR')).toBe('cartões de crédito');
    expect(pluralize('item', 'pt-BR')).toBe('itens');
    expect(pluralize('canal', 'pt-BR')).toBe('canais');
    expect(pluralize('papel', 'pt-BR')).toBe('papéis');
    expect(pluralize('farol', 'pt-BR')).toBe('faróis');
    expect(pluralize('azul', 'pt-BR')).toBe('azuis');
    expect(pluralize('fácil', 'pt-BR')).toBe('fácis');
    expect(pluralize('vez', 'pt-BR')).toBe('vezes');
    expect(pluralize('conta', 'pt-BR')).toBe('contas');
  });
});
