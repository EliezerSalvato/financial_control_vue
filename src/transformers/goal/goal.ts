import type {
  GoalListResult,
  GoalTransaction,
  GoalTransactionAttributesApi,
  GoalTransactionCollectionResponseApi,
  GoalTransactionResourceItemApi,
} from '@/types/goal';
import { keysToCamelCase } from '@/utils/case';
import { resourceId } from '@/transformers/jsonApi';
import { toDecimal } from '@/utils/number';

export function goalTransactionFromResource(resource: GoalTransactionResourceItemApi): GoalTransaction {
  const attributes = keysToCamelCase<GoalTransactionAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    kind: attributes.kind,
    description: attributes.description,
    recurrenceType: attributes.recurrenceType,
    value: toDecimal(attributes.value),
    firstRecurrenceOn: attributes.firstRecurrenceOn,
    currentRecurrenceOn: attributes.currentRecurrenceOn,
    endsOn: attributes.endsOn ?? null,
    categoryId: attributes.categoryId ?? null,
    tagIds: attributes.tagIds ?? [],
  };
}

export function goalTransactionCollectionFromApi(response: GoalTransactionCollectionResponseApi): GoalListResult {
  return {
    goalTransactions: response.data.map(goalTransactionFromResource),
  };
}
