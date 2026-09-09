import type {
  MessageSuccessResponseApi,
  CategoryCollectionResponseApi,
  CategoryCreatePayload,
  CategoryCreateResponseApi,
  CategoryCreateResult,
  CategoryListParams,
  CategoryListResult,
  CategoryShowResult,
  CategorySuccessResponseApi,
  CategoryUpdatePayload,
  CategoryUpdateResult,
} from '@/types/category';
import { apiRequest } from '@/api/client';
import { buildRansackListPath } from '@/api/listQuery';
import { keysToSnakeCase } from '@/utils/case';
import { categoryCollectionFromApi, categoryCreateFromApi, categoryShowFromApi, categoryUpdateFromApi } from '@/transformers/category';

export async function listCategories(params: CategoryListParams = {}): Promise<CategoryListResult> {
  const response = await apiRequest<CategoryCollectionResponseApi>(buildRansackListPath('/api/v1/categories', params));

  return categoryCollectionFromApi(response);
}

export function deleteCategory(id: string | number) {
  return apiRequest<MessageSuccessResponseApi>(`/api/v1/categories/${id}`, {
    method: 'DELETE',
  });
}

export async function getCategory(id: string | number): Promise<CategoryShowResult> {
  const response = await apiRequest<CategorySuccessResponseApi>(`/api/v1/categories/${id}`);

  return categoryShowFromApi(response);
}

export async function createCategory(payload: CategoryCreatePayload): Promise<CategoryCreateResult> {
  const response = await apiRequest<CategoryCreateResponseApi>('/api/v1/categories', {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return categoryCreateFromApi(response);
}

export async function updateCategory(id: string | number, payload: CategoryUpdatePayload): Promise<CategoryUpdateResult> {
  const response = await apiRequest<CategoryCreateResponseApi>(`/api/v1/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return categoryUpdateFromApi(response);
}
