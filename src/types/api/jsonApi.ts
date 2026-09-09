import type { PaginationMetaApi } from './pagination';

export type JsonApiResource<TType extends string, TAttributes> = {
  id: string;
  type: TType;
  attributes: TAttributes;
};

export type JsonApiCollectionResponse<TResource, TMeta = PaginationMetaApi> = {
  status: 'success';
  type: 'collection';
  data: TResource[];
  meta: TMeta;
};

export type JsonApiUnpaginatedCollectionResponse<TResource> = {
  status: 'success';
  type: 'collection';
  data: TResource[];
};

export type JsonApiObjectResponse<TResource> = {
  status: 'success';
  type: 'object';
  message?: string;
  data: TResource;
};

export type JsonApiCreateResponse<TResource> = JsonApiObjectResponse<TResource> & {
  message: string;
};
