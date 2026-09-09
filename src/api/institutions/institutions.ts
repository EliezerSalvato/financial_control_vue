import type {
  MessageSuccessResponseApi,
  InstitutionCollectionResponseApi,
  InstitutionCreatePayload,
  InstitutionCreateResponseApi,
  InstitutionCreateResult,
  InstitutionListParams,
  InstitutionListResult,
  InstitutionShowResult,
  InstitutionSuccessResponseApi,
  InstitutionUpdatePayload,
  InstitutionUpdateResult,
} from '@/types/institution';
import { apiRequest } from '@/api/client';
import { buildRansackListPath } from '@/api/listQuery';
import { keysToSnakeCase } from '@/utils/case';
import { institutionCollectionFromApi, institutionCreateFromApi, institutionShowFromApi, institutionUpdateFromApi } from '@/transformers/institution';

export async function listInstitutions(params: InstitutionListParams = {}): Promise<InstitutionListResult> {
  const response = await apiRequest<InstitutionCollectionResponseApi>(buildRansackListPath('/api/v1/institutions', params));

  return institutionCollectionFromApi(response);
}

export function deleteInstitution(id: string | number) {
  return apiRequest<MessageSuccessResponseApi>(`/api/v1/institutions/${id}`, {
    method: 'DELETE',
  });
}

export async function getInstitution(id: string | number): Promise<InstitutionShowResult> {
  const response = await apiRequest<InstitutionSuccessResponseApi>(`/api/v1/institutions/${id}`);

  return institutionShowFromApi(response);
}

export async function createInstitution(payload: InstitutionCreatePayload): Promise<InstitutionCreateResult> {
  const response = await apiRequest<InstitutionCreateResponseApi>('/api/v1/institutions', {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return institutionCreateFromApi(response);
}

export async function updateInstitution(id: string | number, payload: InstitutionUpdatePayload): Promise<InstitutionUpdateResult> {
  const response = await apiRequest<InstitutionCreateResponseApi>(`/api/v1/institutions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return institutionUpdateFromApi(response);
}
