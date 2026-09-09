import type {
  Category,
  CategoryAttributesApi,
  CategoryCollectionResponseApi,
  CategoryCreateResponseApi,
  CategoryCreateResult,
  CategoryListResult,
  CategoryResourceItemApi,
  CategoryShowResult,
  CategorySuccessResponseApi,
  CategoryUpdateResult,
} from '@/types/category';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';
import { keysToCamelCase } from '@/utils/case';

export function categoryFromResource(resource: CategoryResourceItemApi): Category {
  const attributes = keysToCamelCase<CategoryAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    name: attributes.name,
    color: attributes.color ?? '#000000',
    active: attributes.active,
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
