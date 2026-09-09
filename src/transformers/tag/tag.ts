import type {
  Tag,
  TagAttributesApi,
  TagCollectionResponseApi,
  TagCreateResponseApi,
  TagCreateResult,
  TagListResult,
  TagResourceItemApi,
  TagShowResult,
  TagSuccessResponseApi,
  TagUpdateResult,
} from '@/types/tag';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';
import { keysToCamelCase } from '@/utils/case';

export function tagFromResource(resource: TagResourceItemApi): Tag {
  const attributes = keysToCamelCase<TagAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    name: attributes.name,
    color: attributes.color ?? '#000000',
    active: attributes.active,
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
