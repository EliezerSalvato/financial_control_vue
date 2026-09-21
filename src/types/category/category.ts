import type {
  JsonApiCollectionResponse,
  JsonApiCreateResponse,
  JsonApiObjectResponse,
  JsonApiResource,
  ListParams,
  MutationResult,
  PaginatedListResult,
} from '@/types/api';

export type CategoryGoal = {
  id: string;
  month: number;
  year: number;
  value: number;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  goalEndsOn: string | null;
  currentGoal: CategoryGoal | null;
  goals: CategoryGoal[];
};

export type CategoryGoalAttributesApi = {
  id: string;
  month: number;
  year: number;
  value: string | number;
};

export type CategoryGoalResourceItemApi = JsonApiResource<'category_goal', CategoryGoalAttributesApi>;

export type CategoryAttributesApi = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  goalEndsOn?: string | null;
  currentGoal?: CategoryGoalResourceItemApi | null;
  goals?: CategoryGoalResourceItemApi[];
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
  goalStartsOn: string | null;
  goalValue: number | null;
  goalEndsOn: string | null;
};

export type CategoryCreatePayload = {
  category: {
    name: string;
    color: string;
    active?: boolean;
    goalStartsOn?: string;
    goalValue?: number;
    goalEndsOn?: string;
  };
};

export type CategoryUpdatePayload = CategoryCreatePayload;

export type CategorySuccessResponseApi = JsonApiObjectResponse<CategoryResourceItemApi>;

export type CategoryCreateResponseApi = JsonApiCreateResponse<CategoryResourceItemApi>;

export type CategoryCreateResult = MutationResult<'category', Category>;

export type CategoryUpdateResult = CategoryCreateResult;

export type CategoryShowResult = Category;

export type CategoryGoalForm = {
  value: number | null;
  startsOn: string | null;
  changeForNextMonths: boolean;
};

export type CategoryGoalUpdatePayload = {
  categoryGoal: {
    value: number;
    startsOn: string;
    changeForNextMonths?: boolean;
  };
};

export type CategoryGoalUpdateResult = CategoryUpdateResult;
