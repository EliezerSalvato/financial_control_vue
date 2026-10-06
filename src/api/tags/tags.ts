import type { MessageSuccessResponseApi } from '@/types/api';
import type {
  TagCollectionResponseApi,
  TagCreatePayload,
  TagCreateResponseApi,
  TagCreateResult,
  TagGoalUpdatePayload,
  TagGoalUpdateResult,
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

export async function updateTagGoal(tagId: string | number, payload: TagGoalUpdatePayload): Promise<TagGoalUpdateResult> {
  const response = await apiRequest<TagCreateResponseApi>(`/api/v1/tags/${tagId}/goals`, {
    method: 'PATCH',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return tagUpdateFromApi(response);
}

function normalizeTagName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

async function listAllTagNames(): Promise<Set<string>> {
  const names = new Set<string>();
  let page: number | null = 1;

  while (page) {
    const result = await listTags({ page, perPage: 100 });

    result.tags.forEach((tag) => names.add(normalizeTagName(tag.name)));
    page = result.pagination.nextPage;
  }

  return names;
}

// Skips tags whose name already exists (case-insensitive); returns how many were created.
export async function createMissingTags(tags: readonly { name: string; color: string }[]): Promise<number> {
  const existingNames = await listAllTagNames();
  const missing = tags.filter((tag) => !existingNames.has(normalizeTagName(tag.name)));

  for (const tag of missing) {
    await createTag({ tag: { name: tag.name, color: tag.color, active: true } });
  }

  return missing.length;
}
