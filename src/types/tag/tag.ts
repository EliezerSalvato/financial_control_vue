import type {
  JsonApiCollectionResponse,
  JsonApiCreateResponse,
  JsonApiObjectResponse,
  JsonApiResource,
  ListParams,
  MutationResult,
  PaginatedListResult,
} from '@/types/api';

export type TagGoal = {
  id: string;
  month: number;
  year: number;
  value: number;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  goalEndsOn: string | null;
  currentGoal: TagGoal | null;
  goals: TagGoal[];
};

export type TagGoalAttributesApi = {
  id: string;
  month: number;
  year: number;
  value: string | number;
};

export type TagGoalResourceItemApi = JsonApiResource<'tag_goal', TagGoalAttributesApi>;

export type TagAttributesApi = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  goalEndsOn?: string | null;
  currentGoal?: TagGoalResourceItemApi | null;
  goals?: TagGoalResourceItemApi[];
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
  goalStartsOn: string | null;
  goalValue: number | null;
  goalEndsOn: string | null;
};

export type TagCreatePayload = {
  tag: {
    name: string;
    color: string;
    active?: boolean;
    goalStartsOn?: string;
    goalValue?: number;
    goalEndsOn?: string;
  };
};

export type TagUpdatePayload = TagCreatePayload;

export type TagSuccessResponseApi = JsonApiObjectResponse<TagResourceItemApi>;

export type TagCreateResponseApi = JsonApiCreateResponse<TagResourceItemApi>;

export type TagCreateResult = MutationResult<'tag', Tag>;

export type TagUpdateResult = TagCreateResult;

export type TagShowResult = Tag;

export type TagGoalForm = {
  value: number | null;
  startsOn: string | null;
  changeForNextMonths: boolean;
};

export type TagGoalUpdatePayload = {
  tagGoal: {
    value: number;
    startsOn: string;
    changeForNextMonths?: boolean;
  };
};

export type TagGoalUpdateResult = TagUpdateResult;
