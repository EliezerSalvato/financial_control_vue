import type { MaybeRefOrGetter } from 'vue';
import type { TransactionImportEvent, TransactionImportPreviewPayload, TransactionImportPreviewRow } from '@/types/transaction';
import { previewTransactionImport, subscribeTransactionImport } from '@/api/transactions';
import { countCsvRows } from '@/utils/transactionImport';
import { computed, onUnmounted, ref, toValue, watch } from 'vue';

export function useTransactionImportPreview(active: MaybeRefOrGetter<boolean>) {
  const importId = ref<string | null>(null);
  const totalRows = ref(0);
  const running = ref(false);
  const results = ref<Record<number, TransactionImportEvent>>({});

  let unsubscribe: (() => void) | null = null;

  const processedRows = computed(() => Object.keys(results.value).length);
  const failedRows = computed(() => Object.values(results.value).filter((event) => event.status === 'error').length);
  const previewRows = computed<TransactionImportPreviewRow[]>(() =>
    Object.values(results.value)
      .filter((event) => event.status === 'processed' && event.data)
      .map((event) => ({ ...(event.data as TransactionImportPreviewRow), row: event.row }))
      .sort((a, b) => a.row - b.row),
  );
  const progress = computed(() => (totalRows.value ? Math.min(100, Math.round((processedRows.value / totalRows.value) * 100)) : 0));
  const finished = computed(() => totalRows.value > 0 && processedRows.value >= totalRows.value);

  function record(event: TransactionImportEvent) {
    if (event.importId !== importId.value || event.stage !== 'preview') return;

    results.value = { ...results.value, [event.row]: event };
  }

  // Rows can be broadcast before the POST response tells us the import id: count them provisionally.
  function handleEvent(event: TransactionImportEvent) {
    if (!running.value || event.stage !== 'preview') return;

    if (importId.value === null) {
      results.value = { ...results.value, [event.row]: event };
      return;
    }

    record(event);
  }

  function reset() {
    importId.value = null;
    totalRows.value = 0;
    running.value = false;
    results.value = {};
  }

  async function start(payload: TransactionImportPreviewPayload) {
    reset();
    running.value = true;

    try {
      // Estimate from the file so the progress bar shows up before the server answers.
      totalRows.value = await countCsvRows(payload.file);

      const result = await previewTransactionImport(payload);

      importId.value = result.importId;
      totalRows.value = result.totalRows;
      results.value = Object.fromEntries(Object.entries(results.value).filter(([, event]) => event.importId === result.importId));
    } catch (error) {
      reset();
      throw error;
    }
  }

  function disconnect() {
    unsubscribe?.();
    unsubscribe = null;
  }

  watch(
    () => toValue(active),
    (isActive) => {
      disconnect();
      reset();

      if (isActive) unsubscribe = subscribeTransactionImport(handleEvent);
    },
    { immediate: true },
  );

  onUnmounted(disconnect);

  return { importId, running, totalRows, processedRows, failedRows, previewRows, progress, finished, start, reset };
}
