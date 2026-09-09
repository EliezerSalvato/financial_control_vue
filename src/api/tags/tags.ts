import type {
  MessageSuccessResponseApi,
  TagCollectionResponseApi,
  TagCreatePayload,
  TagCreateResponseApi,
  TagCreateResult,
  TagListParams,
  TagListResult,
  TagShowResult,
  TagSuccessResponseApi,
  TagUpdatePayload,
  TagUpdateResult,
} from '@/types/tag';
import { apiRequest } from '@/api/client';
import { buildRansackListPath } from '@/api/listQuery';
import { keysToSnakeCase } from '@/utils/case';
import { tagCollectionFromApi, tagCreateFromApi, tagShowFromApi, tagUpdateFromApi } from '@/transformers/tag';

export async function listTags(params: TagListParams = {}): Promise<TagListResult> {
  const response = await apiRequest<TagCollectionResponseApi>(buildRansackListPath('/api/v1/tags', params));

  return tagCollectionFromApi(response);
}

export function deleteTag(id: string | number) {
  return apiRequest<MessageSuccessResponseApi>(`/api/v1/tags/${id}`, {
    method: 'DELETE',
  });
}

export async function getTag(id: string | number): Promise<TagShowResult> {
  const response = await apiRequest<TagSuccessResponseApi>(`/api/v1/tags/${id}`);

  return tagShowFromApi(response);
}

export async function createTag(payload: TagCreatePayload): Promise<TagCreateResult> {
  const response = await apiRequest<TagCreateResponseApi>('/api/v1/tags', {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return tagCreateFromApi(response);
}

export async function updateTag(id: string | number, payload: TagUpdatePayload): Promise<TagUpdateResult> {
  const response = await apiRequest<TagCreateResponseApi>(`/api/v1/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return tagUpdateFromApi(response);
}
