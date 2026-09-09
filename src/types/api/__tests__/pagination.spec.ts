import { describe, expect, it } from 'vitest';
import { toPagination } from '@/types/api/pagination';

describe('toPagination', () => {
  it('mapeia meta da API e calcula o offset', () => {
    expect(
      toPagination(
        {
          page: 3,
          per_page: 10,
          count: 42,
          pages: 5,
          next_page: 4,
          prev_page: 2,
        },
        10,
      ),
    ).toEqual({
      currentPage: 3,
      prevPage: 2,
      nextPage: 4,
      totalPages: 5,
      totalCount: 42,
      offsetValue: 20,
      size: 10,
    });
  });

  it('usa o tamanho da página atual, não o per_page da API', () => {
    expect(
      toPagination(
        {
          page: 1,
          per_page: 25,
          count: 3,
          pages: 1,
          next_page: null,
          prev_page: null,
        },
        3,
      ).size,
    ).toBe(3);
  });
});
