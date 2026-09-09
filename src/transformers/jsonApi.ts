import type { JsonApiCollectionResponse, JsonApiCreateResponse, MutationResult, PaginatedListResult } from '@/types/api';
import { toPagination } from '@/types/api';

export function resourceId(attributes: { id?: string }, resource: { id: string }): string {
  return attributes.id ?? resource.id;
}

export function collectionFromApi<TResource, TItem, TKey extends string>(
  response: Pick<JsonApiCollectionResponse<TResource>, 'data' | 'meta'>,
  mapItem: (resource: TResource) => TItem,
  collectionKey: TKey,
): PaginatedListResult<TKey, TItem> {
  const items = response.data.map(mapItem);

  return {
    [collectionKey]: items,
    pagination: toPagination(response.meta, items.length),
  } as PaginatedListResult<TKey, TItem>;
}

export function createResultFromApi<TResource, TItem, TKey extends string>(
  response: Pick<JsonApiCreateResponse<TResource>, 'message' | 'data'>,
  mapItem: (resource: TResource) => TItem,
  entityKey: TKey,
): MutationResult<TKey, TItem> {
  return {
    message: response.message,
    [entityKey]: mapItem(response.data),
  } as MutationResult<TKey, TItem>;
}
