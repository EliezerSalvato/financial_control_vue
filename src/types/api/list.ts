import type { Pagination } from './pagination';

export type ListParams<TFilters extends object = object> = {
  page?: number;
  perPage?: number;
  sort?: string;
  filters?: TFilters;
};

export type PaginatedListResult<TKey extends string, TItem> = {
  [K in TKey]: TItem[];
} & { pagination: Pagination };

export type CollectionListResult<TKey extends string, TItem> = {
  [K in TKey]: TItem[];
};

export type MutationResult<TKey extends string, TItem> = {
  message: string;
} & { [K in TKey]: TItem };
