import type {
  MessageSuccessResponseApi,
  SettledTransactionCollectionResponseApi,
  SettledTransactionListParams,
  SettledTransactionListResult,
  TransactionCollectionResponseApi,
  TransactionCancelResult,
  TransactionCreatePayload,
  TransactionCreateResponseApi,
  TransactionCreateResult,
  TransactionListParams,
  TransactionListResult,
  TransactionRecurrenceCreatePayload,
  TransactionRecurrenceCreateResult,
  TransactionShowResult,
  TransactionSuccessResponseApi,
  TransactionUpdatePayload,
  TransactionUpdateResult,
} from '@/types/transaction';
import { apiRequest } from '@/api/client';
import { buildRansackListPath } from '@/api/listQuery';
import { keysToSnakeCase } from '@/utils/case';
import {
  settledTransactionCollectionFromApi,
  transactionCancelFromApi,
  transactionCollectionFromApi,
  transactionCreateFromApi,
  transactionShowFromApi,
  transactionUpdateFromApi,
} from '@/transformers/transaction';

export async function listTransactions(params: TransactionListParams = {}): Promise<TransactionListResult> {
  const response = await apiRequest<TransactionCollectionResponseApi>(buildRansackListPath('/api/v1/transactions', params));

  return transactionCollectionFromApi(response);
}

function buildSettledPath(params: SettledTransactionListParams): string {
  const search = new URLSearchParams();

  search.set('month', String(params.month));
  search.set('year', String(params.year));

  if (params.type) {
    search.set('type', params.type);
  }

  return `/api/v1/transactions/settled?${search.toString()}`;
}

export async function listSettledTransactions(params: SettledTransactionListParams): Promise<SettledTransactionListResult> {
  const response = await apiRequest<SettledTransactionCollectionResponseApi>(buildSettledPath(params));

  return settledTransactionCollectionFromApi(response);
}

export function deleteTransaction(id: string | number) {
  return apiRequest<MessageSuccessResponseApi>(`/api/v1/transactions/${id}`, {
    method: 'DELETE',
  });
}

export async function cancelTransaction(id: string | number): Promise<TransactionCancelResult> {
  const response = await apiRequest<TransactionCreateResponseApi>(`/api/v1/transactions/${id}/cancel`, {
    method: 'POST',
  });

  return transactionCancelFromApi(response);
}

export async function getTransaction(id: string | number): Promise<TransactionShowResult> {
  const response = await apiRequest<TransactionSuccessResponseApi>(`/api/v1/transactions/${id}`);

  return transactionShowFromApi(response);
}

export async function createTransaction(payload: TransactionCreatePayload): Promise<TransactionCreateResult> {
  const response = await apiRequest<TransactionCreateResponseApi>('/api/v1/transactions', {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return transactionCreateFromApi(response);
}

export async function updateTransaction(id: string | number, payload: TransactionUpdatePayload): Promise<TransactionUpdateResult> {
  const response = await apiRequest<TransactionCreateResponseApi>(`/api/v1/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return transactionUpdateFromApi(response);
}

export async function createTransactionRecurrence(
  transactionId: string | number,
  payload: TransactionRecurrenceCreatePayload,
): Promise<TransactionRecurrenceCreateResult> {
  const response = await apiRequest<TransactionCreateResponseApi>(`/api/v1/transactions/${transactionId}/recurrences`, {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return transactionCreateFromApi(response);
}
