import type { CollectionListResult, JsonApiResource, JsonApiUnpaginatedCollectionResponse, YearMonth } from '@/types/api';

export type GoalTargetKind = 'category' | 'tag';

export type GoalTarget = {
  id: string;
  kind: GoalTargetKind;
  name: string;
  color: string;
  value: number;
};

export type GoalTargetAttributesApi = {
  id: string;
  kind: GoalTargetKind;
  name: string;
  color?: string | null;
  value: string | number;
};

export type GoalTargetResourceItemApi = JsonApiResource<'goal_target', GoalTargetAttributesApi>;

export type GoalTargetCollectionResponseApi = JsonApiUnpaginatedCollectionResponse<GoalTargetResourceItemApi>;

export type GoalTargetListParams = YearMonth;

export type GoalTargetListResult = CollectionListResult<'goalTargets', GoalTarget>;
