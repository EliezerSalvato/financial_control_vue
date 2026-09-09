import { describe, expect, it } from 'vitest';
import { appendListQuery, appendRansackFilters, buildRansackListPath } from '@/api/listQuery';

describe('buildRansackListPath', () => {
  it('serializa paginação, ordenação e filtros Ransack em snake_case', () => {
    const path = buildRansackListPath('/api/v1/tags', {
      page: 2,
      perPage: 10,
      sort: 'name asc',
      filters: { activeEq: true, nameCont: 'foo' },
    });
    const params = new URLSearchParams(path.split('?')[1]);

    expect(path.startsWith('/api/v1/tags?')).toBe(true);
    expect(params.get('page')).toBe('2');
    expect(params.get('per_page')).toBe('10');
    expect(params.get('sort')).toBe('name asc');
    expect(params.get('q[active_eq]')).toBe('true');
    expect(params.get('q[name_cont]')).toBe('foo');
  });

  it('devolve só o caminho quando não há query', () => {
    expect(buildRansackListPath('/api/v1/tags')).toBe('/api/v1/tags');
    expect(buildRansackListPath('/api/v1/tags', { filters: { nameCont: '' } })).toBe('/api/v1/tags');
  });
});

describe('appendListQuery', () => {
  it('omite page, perPage e sort quando não vêm', () => {
    const search = new URLSearchParams();

    appendListQuery(search, {});

    expect(search.toString()).toBe('');
  });
});

describe('appendRansackFilters', () => {
  it('ignora filtros ausentes, nulos e em branco', () => {
    const search = new URLSearchParams();

    appendRansackFilters(search, undefined);
    appendRansackFilters(search, { nameCont: null, activeEq: '', kindEq: 'expense' });

    expect(search.get('q[kind_eq]')).toBe('expense');
    expect(search.has('q[name_cont]')).toBe(false);
    expect(search.has('q[active_eq]')).toBe(false);
  });
});
