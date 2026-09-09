import type {
  JsonApiCollectionResponse,
  JsonApiCreateResponse,
  JsonApiObjectResponse,
  JsonApiResource,
  ListParams,
  MutationResult,
  PaginatedListResult,
} from '@/types/api';

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

export type CategoryResourceItemApi = JsonApiResource<'category', CategoryAttributesApi>;

export type CategoryCollectionResponseApi = JsonApiCollectionResponse<CategoryResourceItemApi>;

export type CategoryListFilters = {
  nameCont?: string;
  activeEq?: boolean;
};

export type CategoryListParams = ListParams<CategoryListFilters>;

export type CategoryListResult = PaginatedListResult<'categories', Category>;

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

export type CategorySuccessResponseApi = JsonApiObjectResponse<CategoryResourceItemApi>;

export type CategoryCreateResponseApi = JsonApiCreateResponse<CategoryResourceItemApi>;

export type CategoryCreateResult = MutationResult<'category', Category>;

export type CategoryUpdateResult = CategoryCreateResult;

export type CategoryShowResult = Category;
