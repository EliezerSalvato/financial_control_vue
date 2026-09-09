import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSelectTypeahead } from '@/composables/useSelectTypeahead';

describe('useSelectTypeahead', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('encontra pelo prefixo e cicla na mesma letra', () => {
    const { findIndex } = useSelectTypeahead();
    const labels = ['Alpha', 'Beta', 'Banana'];

    expect(findIndex(labels, 'b')).toBe(1);
    expect(findIndex(labels, 'b', 1)).toBe(2);
    expect(findIndex(labels, 'b', 2)).toBe(1);
  });

  it('acumula caracteres até o timer resetar', () => {
    vi.useFakeTimers();
    const { findIndex } = useSelectTypeahead();
    const labels = ['Alpha', 'Beta', 'Banana'];

    expect(findIndex(labels, 'b')).toBe(1);
    expect(findIndex(labels, 'a')).toBe(2);

    vi.advanceTimersByTime(500);
    expect(findIndex(labels, 'a')).toBe(0);
  });

  it('ignora teclas que não são letra ou número e limpa a busca', () => {
    const { findIndex, clearQuery } = useSelectTypeahead();
    const labels = ['Alpha', 'Beta'];

    expect(findIndex(labels, 'Enter')).toBe(-1);
    expect(findIndex(labels, 'a')).toBe(0);
    clearQuery();
    expect(findIndex(labels, 'b')).toBe(1);
  });
});
