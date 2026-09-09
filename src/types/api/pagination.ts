export type PaginationMetaApi = {
  page: number;
  per_page: number;
  count: number;
  pages: number;
  next_page: number | null;
  prev_page: number | null;
};

export type Pagination = {
  currentPage: number;
  prevPage: number | null;
  nextPage: number | null;
  totalPages: number;
  totalCount: number;
  offsetValue: number;
  size: number;
};

export function toPagination(meta: PaginationMetaApi, pageSize: number): Pagination {
  return {
    currentPage: meta.page,
    prevPage: meta.prev_page,
    nextPage: meta.next_page,
    totalPages: meta.pages,
    totalCount: meta.count,
    offsetValue: (meta.page - 1) * meta.per_page,
    size: pageSize,
  };
}
