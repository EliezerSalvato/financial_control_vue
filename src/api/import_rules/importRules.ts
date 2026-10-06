import type { MessageSuccessResponseApi } from '@/types/api';
import type {
  ImportRuleCollectionResponseApi,
  ImportRuleCreatePayload,
  ImportRuleCreateResponseApi,
  ImportRuleCreateResult,
  ImportRuleListParams,
  ImportRuleListResult,
  ImportRuleShowResult,
  ImportRuleSuccessResponseApi,
  ImportRuleUpdatePayload,
  ImportRuleUpdateResult,
} from '@/types/import_rule';
import { apiRequest } from '@/api/client';
import { buildRansackListPath } from '@/api/listQuery';
import { keysToSnakeCase } from '@/utils/case';
import { importRuleCollectionFromApi, importRuleCreateFromApi, importRuleShowFromApi, importRuleUpdateFromApi } from '@/transformers/import_rule';

const BASE_PATH = '/api/v1/transactions/import_rules';

export async function listImportRules(params: ImportRuleListParams = {}): Promise<ImportRuleListResult> {
  const response = await apiRequest<ImportRuleCollectionResponseApi>(buildRansackListPath(BASE_PATH, params));

  return importRuleCollectionFromApi(response);
}

export async function getImportRule(id: string | number): Promise<ImportRuleShowResult> {
  const response = await apiRequest<ImportRuleSuccessResponseApi>(`${BASE_PATH}/${id}`);

  return importRuleShowFromApi(response);
}

export function deleteImportRule(id: string | number) {
  return apiRequest<MessageSuccessResponseApi>(`${BASE_PATH}/${id}`, {
    method: 'DELETE',
  });
}

export async function createImportRule(payload: ImportRuleCreatePayload): Promise<ImportRuleCreateResult> {
  const response = await apiRequest<ImportRuleCreateResponseApi>(BASE_PATH, {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return importRuleCreateFromApi(response);
}

export async function updateImportRule(id: string | number, payload: ImportRuleUpdatePayload): Promise<ImportRuleUpdateResult> {
  const response = await apiRequest<ImportRuleCreateResponseApi>(`${BASE_PATH}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return importRuleUpdateFromApi(response);
}
