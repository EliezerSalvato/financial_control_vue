import type {
  TransactionImportConfirmPayload,
  TransactionImportConfirmResult,
  TransactionImportEvent,
  TransactionImportPreviewPayload,
  TransactionImportPreviewResponseApi,
  TransactionImportPreviewResult,
} from '@/types/transaction';
import { apiRequest } from '@/api/client';
import { keysToSnakeCase } from '@/utils/case';
import { subscribeToChannel } from '@/api/cable';
import { transactionImportEventFromApi, transactionImportPreviewFromApi } from '@/transformers/transaction';

export async function previewTransactionImport(payload: TransactionImportPreviewPayload): Promise<TransactionImportPreviewResult> {
  const body = new FormData();

  body.append('kind', payload.kind);
  body.append('payment_method', payload.paymentMethod);
  body.append('file', payload.file);

  if (payload.accountId) body.append('account_id', payload.accountId);

  if (payload.creditCardId) body.append('credit_card_id', payload.creditCardId);

  const response = await apiRequest<TransactionImportPreviewResponseApi>('/api/v1/transactions/imports/previews', {
    method: 'POST',
    body,
  });

  return transactionImportPreviewFromApi(response);
}

export async function confirmTransactionImport(payload: TransactionImportConfirmPayload): Promise<TransactionImportConfirmResult> {
  const response = await apiRequest<TransactionImportPreviewResponseApi>('/api/v1/transactions/imports', {
    method: 'POST',
    body: JSON.stringify(keysToSnakeCase(payload)),
  });

  return transactionImportPreviewFromApi(response);
}

export function subscribeTransactionImport(onEvent: (event: TransactionImportEvent) => void): () => void {
  return subscribeToChannel({
    channel: 'TransactionImportChannel',
    onMessage: (message) => {
      onEvent(transactionImportEventFromApi(message));
    },
  });
}
