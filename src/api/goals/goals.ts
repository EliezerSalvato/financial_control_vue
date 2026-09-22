import type {
  GoalListParams,
  GoalListResult,
  GoalTargetCollectionResponseApi,
  GoalTargetListParams,
  GoalTargetListResult,
  GoalTransactionCollectionResponseApi,
} from '@/types/goal';
import { apiRequest } from '@/api/client';
import { goalTargetCollectionFromApi, goalTransactionCollectionFromApi } from '@/transformers/goal';

function buildPeriodQuery(params: GoalListParams): string {
  const search = new URLSearchParams();

  search.set('month', String(params.month));
  search.set('year', String(params.year));

  return search.toString();
}

export async function listGoals(params: GoalListParams): Promise<GoalListResult> {
  const response = await apiRequest<GoalTransactionCollectionResponseApi>(`/api/v1/goals?${buildPeriodQuery(params)}`);

  return goalTransactionCollectionFromApi(response);
}

export async function listGoalTargets(params: GoalTargetListParams): Promise<GoalTargetListResult> {
  const response = await apiRequest<GoalTargetCollectionResponseApi>(`/api/v1/goals/targets?${buildPeriodQuery(params)}`);

  return goalTargetCollectionFromApi(response);
}
