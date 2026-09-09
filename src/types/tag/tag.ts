import type { Pagination, PaginationMetaApi } from '@/types/api/pagination';

export type Tag = {
  id: string;
  name: string;
  color: string;
  active: boolean;
};

export type TagAttributesApi = {
  id: string;
  name: string;
  color: string;
  active: boolean;
};

export type TagResourceItemApi = {
  id: string;
  type: 'tag';
  attributes: TagAttributesApi;
};

export type TagCollectionResponseApi = {
  status: 'success';
  type: 'collection';
  data: TagResourceItemApi[];
  meta: PaginationMetaApi;
};

export type TagListFilters = {
  nameCont?: string;
  activeEq?: boolean;
};

export type TagListParams = {
  page?: number;
  perPage?: number;
  filters?: TagListFilters;
  sort?: string;
};

export type TagListResult = {
  tags: Tag[];
  pagination: Pagination;
};

export type { MessageSuccessResponseApi } from '@/types/api';

export type TagForm = {
  name: string;
  color: string;
  active: boolean;
};

export type TagCreatePayload = {
  tag: {
    name: string;
    color: string;
    active?: boolean;
  };
};

export type TagUpdatePayload = TagCreatePayload;

export type TagSuccessResponseApi = {
  status: 'success';
  type: 'object';
  message?: string;
  data: TagResourceItemApi;
};

export type TagCreateResponseApi = TagSuccessResponseApi & {
  message: string;
};

export type TagCreateResult = {
  message: string;
  tag: Tag;
};

export type TagUpdateResult = TagCreateResult;

export type TagShowResult = Tag;
