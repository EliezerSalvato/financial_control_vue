import type { MessageSuccessResponseApi } from '@/types/api';
import type {
  AccountCollectionResponseApi,
  AccountCreatePayload,
  AccountCreateResponseApi,
  AccountCreateResult,
  AccountListParams,
  AccountListResult,
  AccountShowResult,
  AccountSuccessResponseApi,
  AccountUpdatePayload,
  AccountUpdateResult,
} from '@/types/account';
import { apiRequest } from '@/api/client';
import { buildRansackListPath } from '@/api/listQuery';
import { keysToSnakeCase } from '@/utils/case';
import { accountCollectionFromApi, accountCreateFromApi, accountShowFromApi, accountUpdateFromApi } from '@/transformers/account';

export async function listAccounts(params: AccountListParams = {}): Promise<AccountListResult> {
  const response = await apiRequest<AccountCollectionResponseApi>(buildRansackListPath('/api/v1/accounts', params));

  return accountCollectionFromApi(response);
}

export function deleteAccount(id: string | number) {
  return apiRequest<MessageSuccessResponseApi>(`/api/v1/accounts/${id}`, {
    method: 'DELETE',
  });
}

export async function getAccount(id: string | number): Promise<AccountShowResult> {
  const response = await apiRequest<AccountSuccessResponseApi>(`/api/v1/accounts/${id}`);

  return accountShowFromApi(response);
}

export async function createAccount(payload: AccountCreatePayload): Promise<AccountCreateResult> {
  const response = await apiRequest<AccountCreateResponseApi>('/api/v1/accounts', {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return accountCreateFromApi(response);
}

export async function updateAccount(id: string | number, payload: AccountUpdatePayload): Promise<AccountUpdateResult> {
  const response = await apiRequest<AccountCreateResponseApi>(`/api/v1/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return accountUpdateFromApi(response);
}
