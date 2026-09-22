import type {
  GoalTarget,
  GoalTargetAttributesApi,
  GoalTargetCollectionResponseApi,
  GoalTargetListResult,
  GoalTargetResourceItemApi,
} from '@/types/goal';
import { keysToCamelCase } from '@/utils/case';
import { resourceId } from '@/transformers/jsonApi';
import { toDecimal } from '@/utils/number';

export function goalTargetFromResource(resource: GoalTargetResourceItemApi): GoalTarget {
  const attributes = keysToCamelCase<GoalTargetAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    kind: attributes.kind,
    name: attributes.name,
    color: attributes.color ?? '#000000',
    value: toDecimal(attributes.value),
  };
}

export function goalTargetCollectionFromApi(response: GoalTargetCollectionResponseApi): GoalTargetListResult {
  return {
    goalTargets: response.data.map(goalTargetFromResource),
  };
}
