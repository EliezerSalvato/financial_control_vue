import type {
  Category,
  CategoryAttributesApi,
  CategoryCollectionResponseApi,
  CategoryCreateResponseApi,
  CategoryCreateResult,
  CategoryGoal,
  CategoryGoalAttributesApi,
  CategoryGoalResourceItemApi,
  CategoryListResult,
  CategoryResourceItemApi,
  CategoryShowResult,
  CategorySuccessResponseApi,
  CategoryUpdateResult,
} from '@/types/category';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';
import { keysToCamelCase } from '@/utils/case';
import { toDecimal } from '@/utils/number';

export function categoryGoalFromResource(resource: CategoryGoalResourceItemApi): CategoryGoal {
  const attributes = keysToCamelCase<CategoryGoalAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    month: attributes.month,
    year: attributes.year,
    value: toDecimal(attributes.value),
  };
}

export function categoryFromResource(resource: CategoryResourceItemApi): Category {
  const attributes = keysToCamelCase<CategoryAttributesApi>(resource.attributes);
  const goals = (attributes.goals ?? []).map(categoryGoalFromResource).sort((left, right) => {
    if (left.year !== right.year) return left.year - right.year;

    return left.month - right.month;
  });

  return {
    id: resourceId(attributes, resource),
    name: attributes.name,
    color: attributes.color ?? '#000000',
    active: attributes.active,
    goalEndsOn: attributes.goalEndsOn ?? null,
    currentGoal: attributes.currentGoal ? categoryGoalFromResource(attributes.currentGoal) : null,
    goals,
  };
}

export function categoryCollectionFromApi(response: CategoryCollectionResponseApi): CategoryListResult {
  return collectionFromApi(response, categoryFromResource, 'categories');
}

export function categoryShowFromApi(response: CategorySuccessResponseApi): CategoryShowResult {
  return categoryFromResource(response.data);
}

export function categoryCreateFromApi(response: CategoryCreateResponseApi): CategoryCreateResult {
  return createResultFromApi(response, categoryFromResource, 'category');
}

export function categoryUpdateFromApi(response: CategoryCreateResponseApi): CategoryUpdateResult {
  return categoryCreateFromApi(response);
}
