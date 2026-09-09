import type {
  JsonApiCollectionResponse,
  JsonApiCreateResponse,
  JsonApiObjectResponse,
  JsonApiResource,
  ListParams,
  MutationResult,
  PaginatedListResult,
} from '@/types/api';

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

export type TagResourceItemApi = JsonApiResource<'tag', TagAttributesApi>;

export type TagCollectionResponseApi = JsonApiCollectionResponse<TagResourceItemApi>;

export type TagListFilters = {
  nameCont?: string;
  activeEq?: boolean;
};

export type TagListParams = ListParams<TagListFilters>;

export type TagListResult = PaginatedListResult<'tags', Tag>;

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

export type TagSuccessResponseApi = JsonApiObjectResponse<TagResourceItemApi>;

export type TagCreateResponseApi = JsonApiCreateResponse<TagResourceItemApi>;

export type TagCreateResult = MutationResult<'tag', Tag>;

export type TagUpdateResult = TagCreateResult;

export type TagShowResult = Tag;
