import type { TransactionImportPreviewRow } from '@/types/transaction';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTransactionImportStore = defineStore('transactionImport', () => {
  const importId = ref<string | null>(null);
  const rows = ref<TransactionImportPreviewRow[]>([]);

  function setPreview(id: string, previewRows: TransactionImportPreviewRow[]) {
    importId.value = id;
    rows.value = previewRows;
  }

  function reset() {
    importId.value = null;
    rows.value = [];
  }

  return { importId, rows, setPreview, reset };
});
