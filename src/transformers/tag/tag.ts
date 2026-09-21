import type {
  Tag,
  TagAttributesApi,
  TagCollectionResponseApi,
  TagCreateResponseApi,
  TagCreateResult,
  TagGoal,
  TagGoalAttributesApi,
  TagGoalResourceItemApi,
  TagListResult,
  TagResourceItemApi,
  TagShowResult,
  TagSuccessResponseApi,
  TagUpdateResult,
} from '@/types/tag';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';
import { keysToCamelCase } from '@/utils/case';
import { toDecimal } from '@/utils/number';

export function tagGoalFromResource(resource: TagGoalResourceItemApi): TagGoal {
  const attributes = keysToCamelCase<TagGoalAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    month: attributes.month,
    year: attributes.year,
    value: toDecimal(attributes.value),
  };
}

export function tagFromResource(resource: TagResourceItemApi): Tag {
  const attributes = keysToCamelCase<TagAttributesApi>(resource.attributes);
  const goals = (attributes.goals ?? []).map(tagGoalFromResource).sort((left, right) => {
    if (left.year !== right.year) return left.year - right.year;

    return left.month - right.month;
  });

  return {
    id: resourceId(attributes, resource),
    name: attributes.name,
    color: attributes.color ?? '#000000',
    active: attributes.active,
    goalEndsOn: attributes.goalEndsOn ?? null,
    currentGoal: attributes.currentGoal ? tagGoalFromResource(attributes.currentGoal) : null,
    goals,
  };
}

export function tagCollectionFromApi(response: TagCollectionResponseApi): TagListResult {
  return collectionFromApi(response, tagFromResource, 'tags');
}

export function tagShowFromApi(response: TagSuccessResponseApi): TagShowResult {
  return tagFromResource(response.data);
}

export function tagCreateFromApi(response: TagCreateResponseApi): TagCreateResult {
  return createResultFromApi(response, tagFromResource, 'tag');
}

export function tagUpdateFromApi(response: TagCreateResponseApi): TagUpdateResult {
  return tagCreateFromApi(response);
}
