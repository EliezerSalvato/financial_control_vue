import type { TransactionImportEvent, TransactionImportPreviewResponseApi, TransactionImportPreviewResult } from '@/types/transaction';
import { keysToCamelCase } from '@/utils/case';

export function transactionImportPreviewFromApi(response: TransactionImportPreviewResponseApi): TransactionImportPreviewResult {
  return {
    importId: response.data.import_id,
    totalRows: response.data.total_rows,
  };
}

export function transactionImportEventFromApi(payload: unknown): TransactionImportEvent {
  return keysToCamelCase<TransactionImportEvent>(payload);
}
