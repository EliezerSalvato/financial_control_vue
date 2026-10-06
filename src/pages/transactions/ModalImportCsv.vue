<script setup lang="ts">
import type { TransactionImportPreviewForm, TransactionPaymentMethod } from '@/types/transaction';
import { useFormErrors } from '@/composables/useFormErrors';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useTransactionImportPreview } from '@/composables/useTransactionImportPreview';
import { useTransactionImportStore } from '@/stores/transactionImport';
import { MAX_IMPORT_ROWS, countCsvRows } from '@/utils/transactionImport';
import { computed, onMounted, reactive, useTemplateRef, watch } from 'vue';
import { EXPENSE_PAYMENT_METHODS, INCOME_PAYMENT_METHODS, useTransactionForm } from '@/composables/useTransactionForm';
import AccountSelect from '@/components/inputs/AccountSelect.vue';
import CreditCardSelect from '@/components/inputs/CreditCardSelect.vue';
import Modal from '@/components/Modal.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import Select from '@/components/inputs/Select.vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useI18n();
const router = useRouter();
const importStore = useTransactionImportStore();
const { accountItems, creditCardItems, loadOptionLists } = useTransactionForm();
const { importId, running, totalRows, processedRows, failedRows, previewRows, progress, finished, start } = useTransactionImportPreview(
  () => props.open,
);

const fileInput = useTemplateRef<HTMLInputElement>('fileInput');

const form = reactive<TransactionImportPreviewForm>({
  kind: '',
  paymentMethod: '',
  accountId: '',
  creditCardId: '',
  file: null,
});

const { errors, applyCatch, createHandler, resetErrors } = useFormErrors(form);

const kindItems = computed(() => ({
  expense: t('transactions.kinds.expense'),
  income: t('transactions.kinds.income'),
}));

const paymentMethodLabels: Record<TransactionPaymentMethod, string> = {
  pix: 'pix',
  debit: 'debit',
  credit_card: 'creditCard',
  ted: 'ted',
  doc: 'doc',
  deposit: 'deposit',
  cash: 'cash',
  boleto: 'boleto',
};

const paymentMethodItems = computed(() => {
  const methods = form.kind === 'income' ? INCOME_PAYMENT_METHODS : EXPENSE_PAYMENT_METHODS;

  return Object.fromEntries(methods.map((method) => [method, t(`transactions.paymentMethods.${paymentMethodLabels[method]}`)]));
});

// Once every row is processed the form is usable again for another file.
const busy = computed(() => running.value && !finished.value);
const isCreditCard = computed(() => form.paymentMethod === 'credit_card');
const hasPaymentMethod = computed(() => form.paymentMethod !== '');

function onKindChange() {
  form.paymentMethod = '';
  form.accountId = '';
  form.creditCardId = '';
}

function onPaymentMethodChange() {
  form.accountId = '';
  form.creditCardId = '';
}

function onFileChange(event: Event) {
  form.file = (event.target as HTMLInputElement).files?.[0] ?? null;
}

function close() {
  emit('update:open', false);
}

function validate(): boolean {
  const handler = createHandler().checkBlank(['kind', 'paymentMethod', 'file']);

  if (hasPaymentMethod.value) handler.checkBlank([isCreditCard.value ? 'creditCardId' : 'accountId']);

  errors.value = handler.all;

  return handler.isValid;
}

async function submit() {
  if (busy.value || !validate()) return;

  if ((await countCsvRows(form.file as File)) > MAX_IMPORT_ROWS) {
    errors.value.file = [t('transactions.import.tooManyRows', { max: MAX_IMPORT_ROWS })];
    return;
  }

  try {
    await start({
      kind: form.kind as 'income' | 'expense',
      paymentMethod: form.paymentMethod as TransactionPaymentMethod,
      accountId: isCreditCard.value ? undefined : form.accountId,
      creditCardId: isCreditCard.value ? form.creditCardId : undefined,
      file: form.file as File,
    });
  } catch (error) {
    applyCatch(error);
  }
}

function resetForm() {
  form.kind = '';
  form.paymentMethod = '';
  form.accountId = '';
  form.creditCardId = '';
  form.file = null;
  if (fileInput.value) fileInput.value.value = '';

  resetErrors();
}

// Only rows that came back processed can be reviewed; skipped (already imported) and failed ones have no data.
watch(finished, (isFinished) => {
  if (!isFinished || !importId.value || previewRows.value.length === 0) return;

  importStore.setPreview(importId.value, previewRows.value);
  close();
  void router.push({ name: 'transactionsImport' });
});

watch(
  () => props.open,
  (open) => {
    if (open) resetForm();
  },
);

onMounted(loadOptionLists);
</script>

<template>
  <Modal :title="t('transactions.importCsv')" :open-modal="open" @close="close">
    <template #body>
      <form id="import-csv-form" @submit.prevent="submit">
        <NotificationMessage v-if="errors.base.length" type="danger" @close="errors.base = []">
          <p v-for="error in errors.base" :key="error">{{ error }}</p>
        </NotificationMessage>

        <div class="field">
          <Select
            v-model="form.kind"
            name="importKind"
            :label="t('transactions.form.kind')"
            :placeholder="t('transactions.form.kindPlaceholder')"
            :items="kindItems"
            :disabled="busy"
            required
            :error="errors.kind[0]"
            @change:selected="onKindChange"
          />
        </div>

        <div class="field">
          <Select
            v-model="form.paymentMethod"
            name="importPaymentMethod"
            :label="t('transactions.form.paymentMethod')"
            :placeholder="t('transactions.form.paymentMethodPlaceholder')"
            :items="paymentMethodItems"
            :disabled="busy || !form.kind"
            required
            :error="errors.paymentMethod[0]"
            @change:selected="onPaymentMethodChange"
          />
        </div>

        <div v-if="hasPaymentMethod" class="field">
          <CreditCardSelect
            v-if="isCreditCard"
            v-model="form.creditCardId"
            v-model:items="creditCardItems"
            name="importCreditCardId"
            :label="t('transactions.form.creditCardId')"
            :placeholder="t('transactions.form.creditCardIdPlaceholder')"
            :disabled="busy"
            required
            :error="errors.creditCardId[0]"
          />
          <AccountSelect
            v-else
            v-model="form.accountId"
            v-model:items="accountItems"
            name="importAccountId"
            :label="t('transactions.form.accountId')"
            :placeholder="t('transactions.form.accountIdPlaceholder')"
            :disabled="busy"
            required
            :error="errors.accountId[0]"
          />
        </div>

        <div class="field">
          <label class="label" for="importFile">
            {{ t('transactions.import.file') }}
            <abbr :title="t('required')">*</abbr>
          </label>
          <div class="file has-name is-fullwidth" :class="{ 'is-danger': errors.file[0] }">
            <label class="file-label">
              <input
                id="importFile"
                ref="fileInput"
                class="file-input"
                type="file"
                name="importFile"
                accept=".csv,text/csv"
                :disabled="busy"
                @change="onFileChange"
              />
              <span class="file-cta">
                <span class="file-icon"><i class="fas fa-upload" aria-hidden="true"></i></span>
                <span class="file-label">{{ t('transactions.import.chooseFile') }}</span>
              </span>
              <span class="file-name" :class="{ 'has-text-grey-light': !form.file }">{{
                form.file?.name ?? t('transactions.import.noFileSelected')
              }}</span>
            </label>
          </div>
          <p v-if="errors.file[0]" class="help is-danger">{{ errors.file[0] }}</p>
        </div>

        <div v-if="totalRows > 0" class="field">
          <progress class="progress" :class="finished ? 'is-success' : 'is-info'" :value="progress" max="100">{{ progress }}%</progress>
          <p class="help">
            {{ t('transactions.import.progress', { processed: processedRows, total: totalRows, percent: progress }) }}
            <span v-if="failedRows > 0" class="has-text-danger">· {{ t('transactions.import.failed', { count: failedRows }) }}</span>
          </p>
          <p v-if="finished && previewRows.length === 0" class="help is-warning">{{ t('transactions.import.nothingToReview') }}</p>
        </div>
      </form>
    </template>

    <template #footer>
      <button type="submit" form="import-csv-form" class="button is-link" :class="{ 'is-loading': busy && !totalRows }" :disabled="busy">
        {{ t('transactions.import.submit') }}
      </button>
      <button type="button" class="button" @click="close">{{ t('buttons.back') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.button + .button {
  margin-left: 7px;
}
</style>
