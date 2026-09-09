import type { Pagination, PaginationMetaApi } from '@/types/api/pagination';
import { toPagination } from '@/types/api/pagination';

export function resourceId(attributes: { id?: string }, resource: { id: string }): string {
  return attributes.id ?? resource.id;
}

export function collectionFromApi<TResource, TItem, TKey extends string>(
  response: { data: TResource[]; meta: PaginationMetaApi },
  mapItem: (resource: TResource) => TItem,
  collectionKey: TKey,
): { [K in TKey]: TItem[] } & { pagination: Pagination } {
  const items = response.data.map(mapItem);

  return {
    [collectionKey]: items,
    pagination: toPagination(response.meta, items.length),
  } as { [K in TKey]: TItem[] } & { pagination: Pagination };
}

export function createResultFromApi<TResource, TItem, TKey extends string>(
  response: { message: string; data: TResource },
  mapItem: (resource: TResource) => TItem,
  entityKey: TKey,
): { message: string } & { [K in TKey]: TItem } {
  return {
    message: response.message,
    [entityKey]: mapItem(response.data),
  } as { message: string } & { [K in TKey]: TItem };
}
