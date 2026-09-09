import type { ListParams } from '@/types/api';
import { toSnakeKey } from '@/utils/case';

export type ListQueryParams = ListParams;

export function appendListQuery(search: URLSearchParams, params: Pick<ListQueryParams, 'page' | 'perPage' | 'sort'>): void {
  if (params.page != null) {
    search.set('page', String(params.page));
  }

  if (params.perPage != null) {
    search.set('per_page', String(params.perPage));
  }

  if (params.sort) {
    search.set('sort', params.sort);
  }
}

export function appendRansackFilters(search: URLSearchParams, filters: object | undefined): void {
  if (!filters) return;

  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === '') continue;

    search.set(`q[${toSnakeKey(key)}]`, String(value));
  }
}

export function buildRansackListPath(basePath: string, params: ListQueryParams = {}): string {
  const search = new URLSearchParams();

  appendListQuery(search, params);
  appendRansackFilters(search, params.filters);

  const query = search.toString();

  return query ? `${basePath}?${query}` : basePath;
}
