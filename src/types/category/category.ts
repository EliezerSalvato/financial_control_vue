import type { Pagination, PaginationMetaApi } from '@/types/api/pagination';

export type Category = {
  id: string;
  name: string;
  color: string;
  active: boolean;
};

export type CategoryAttributesApi = {
  id: string;
  name: string;
  color: string;
  active: boolean;
};

export type CategoryResourceItemApi = {
  id: string;
  type: 'category';
  attributes: CategoryAttributesApi;
};

export type CategoryCollectionResponseApi = {
  status: 'success';
  type: 'collection';
  data: CategoryResourceItemApi[];
  meta: PaginationMetaApi;
};

export type CategoryListFilters = {
  nameCont?: string;
  activeEq?: boolean;
};

export type CategoryListParams = {
  page?: number;
  perPage?: number;
  filters?: CategoryListFilters;
  sort?: string;
};

export type CategoryListResult = {
  categories: Category[];
  pagination: Pagination;
};

export type { MessageSuccessResponseApi } from '@/types/api';

export type CategoryForm = {
  name: string;
  color: string;
  active: boolean;
};

export type CategoryCreatePayload = {
  category: {
    name: string;
    color: string;
    active?: boolean;
  };
};

export type CategoryUpdatePayload = CategoryCreatePayload;

export type CategorySuccessResponseApi = {
  status: 'success';
  type: 'object';
  message?: string;
  data: CategoryResourceItemApi;
};

export type CategoryCreateResponseApi = CategorySuccessResponseApi & {
  message: string;
};

export type CategoryCreateResult = {
  message: string;
  category: Category;
};

export type CategoryUpdateResult = CategoryCreateResult;

export type CategoryShowResult = Category;
