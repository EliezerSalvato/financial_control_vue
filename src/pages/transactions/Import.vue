<script setup lang="ts">
import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import type { Pagination } from '@/types/api';
import type { TransactionImportEvent } from '@/types/transaction';
import type { TransactionImportRowForm } from '@/utils/transactionImport';
import { getAccount } from '@/api/accounts';
import { getCreditCard } from '@/api/credit_cards';
import { listCategories } from '@/api/categories';
import { listTags } from '@/api/tags';
import { notifyApiError } from '@/utils/notifyApiError';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useTransactionImportStore } from '@/stores/transactionImport';
import { confirmTransactionImport, subscribeTransactionImport } from '@/api/transactions';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { confirmRowFromForm, isRowValid, newOptionsFromPreview, resetRecurrenceFields, rowFormFromPreview } from '@/utils/transactionImport';
import Calendar from '@/components/inputs/Calendar.vue';
import CheckBox from '@/components/inputs/CheckBox.vue';
import ColorSelect from '@/components/inputs/ColorSelect.vue';
import InputNumeric from '@/components/inputs/InputNumeric.vue';
import InputNumber from '@/components/inputs/InputNumber.vue';
import InputText from '@/components/inputs/InputText.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import Paginator from '@/components/Paginator.vue';
import Select from '@/components/inputs/Select.vue';
import SelectMultiple from '@/components/inputs/SelectMultiple.vue';

const { t } = useI18n();
const router = useRouter();
const importStore = useTransactionImportStore();

const rows = ref<TransactionImportRowForm[]>([]);
const categoryItems = ref<ColorOption[]>([]);
const tagItems = ref<ColorOption[]>([]);
const results = ref<Record<number, TransactionImportEvent>>({});
const destinationName = ref('');
const importing = ref(false);
const totalRows = ref(0);

// Sentinel for the "no value" option of the category/tag filters; real keys are ids or `new:` names.
const EMPTY_FILTER = '__empty__';

let unsubscribe: (() => void) | null = null;

const summary = computed(() => importStore.rows[0] ?? null);

const limitConsumptionTypeItems = computed(() => ({
  upfront: t('transactions.limitConsumptionTypes.upfront'),
  monthly: t('transactions.limitConsumptionTypes.monthly'),
}));

const recurrenceTypeItems = computed(() => ({
  one_time: t('transactions.recurrenceTypes.oneTime'),
  installment: t('transactions.recurrenceTypes.installment'),
  recurring: t('transactions.recurrenceTypes.recurring'),
}));

const paymentMethodLabels: Record<string, string> = {
  pix: 'pix',
  debit: 'debit',
  credit_card: 'creditCard',
  ted: 'ted',
  doc: 'doc',
  deposit: 'deposit',
  cash: 'cash',
  boleto: 'boleto',
};

const kindLabel = computed(() => (summary.value ? t(`transactions.kinds.${summary.value.kind}`) : ''));
const paymentMethodLabel = computed(() =>
  summary.value ? t(`transactions.paymentMethods.${paymentMethodLabels[summary.value.paymentMethod]}`) : '',
);

const emptyFilterOption = computed<ColorOption>(() => ({ key: EMPTY_FILTER, label: t('transactions.importPage.filterEmpty') }));
const categoryFilterItems = computed(() => [emptyFilterOption.value, ...categoryItems.value]);
const tagFilterItems = computed(() => [emptyFilterOption.value, ...tagItems.value]);

function matchesCategory(row: TransactionImportRowForm): boolean {
  if (!filters.categoryKey) return true;

  if (filters.categoryKey === EMPTY_FILTER) return !row.categoryKey;

  return row.categoryKey === filters.categoryKey;
}

function matchesTags(row: TransactionImportRowForm): boolean {
  if (filters.tagKeys.length === 0) return true;

  const wantsEmpty = filters.tagKeys.includes(EMPTY_FILTER);
  const keys = filters.tagKeys.filter((key) => key !== EMPTY_FILTER);

  if (wantsEmpty && row.tagKeys.length === 0) return true;

  return keys.length > 0 && keys.every((key) => row.tagKeys.includes(key));
}

const filters = reactive({
  date: null as string | null,
  description: '',
  amount: '',
  recurrenceType: '' as string | number | null,
  endsOn: null as string | null,
  categoryKey: '',
  tagKeys: [] as string[],
});

// Filters are evaluated only when they change: editing a row afterwards must not make it vanish from the list.
const matchingRowNumbers = ref<Set<number> | null>(null);

const filteredRows = computed(() => {
  const matching = matchingRowNumbers.value;

  return matching ? rows.value.filter((row) => matching.has(row.row)) : rows.value;
});

const PAGE_SIZE = 100;
const page = ref(1);

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / PAGE_SIZE)));
const currentPage = computed(() => Math.min(page.value, totalPages.value));
const pagedRows = computed(() => filteredRows.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE));
const pagination = computed<Pagination>(() => ({
  currentPage: currentPage.value,
  prevPage: currentPage.value > 1 ? currentPage.value - 1 : null,
  nextPage: currentPage.value < totalPages.value ? currentPage.value + 1 : null,
  totalPages: totalPages.value,
  totalCount: filteredRows.value.length,
  offsetValue: (currentPage.value - 1) * PAGE_SIZE,
  size: pagedRows.value.length,
}));

function rowMatchesFilters(row: TransactionImportRowForm): boolean {
  return (
    (!filters.date || row.date === filters.date) &&
    (!filters.description.trim() || row.description.toLowerCase().includes(filters.description.trim().toLowerCase())) &&
    (!filters.amount.trim() || (row.amount ?? 0).toFixed(2).includes(filters.amount.trim().replace(',', '.'))) &&
    (!filters.recurrenceType || row.recurrenceType === filters.recurrenceType) &&
    (!filters.endsOn || row.endsOn === filters.endsOn) &&
    matchesCategory(row) &&
    matchesTags(row)
  );
}

function applyFilters() {
  const hasFilter = Boolean(
    filters.date ||
    filters.description.trim() ||
    filters.amount.trim() ||
    filters.recurrenceType ||
    filters.endsOn ||
    filters.categoryKey ||
    filters.tagKeys.length,
  );

  page.value = 1;
  matchingRowNumbers.value = hasFilter ? new Set(rows.value.filter(rowMatchesFilters).map((row) => row.row)) : null;

  // Changing the filter selects only the rows that belong to it; with no filter, every row is selected.
  const matching = matchingRowNumbers.value;

  rows.value.forEach((row) => (row.create = matching ? matching.has(row.row) : true));
}

watch(filters, applyFilters, { deep: true });

const bulk = reactive({
  recurrenceType: '' as string | number | null,
  categoryKey: '',
  tagKeys: [] as string[],
});

// Only visible rows are touched, so a filter narrows what the bulk edit reaches.
const bulkTargets = computed(() => filteredRows.value.filter((row) => row.create));
const hasBulkValues = computed(() => Boolean(bulk.recurrenceType || bulk.categoryKey || bulk.tagKeys.length));

function applyBulk() {
  bulkTargets.value.forEach((row) => {
    if (bulk.recurrenceType) {
      row.recurrenceType = String(bulk.recurrenceType);
      resetRecurrenceFields(row);
    }

    if (bulk.categoryKey) row.categoryKey = bulk.categoryKey;

    if (bulk.tagKeys.length) row.tagKeys = [...new Set([...row.tagKeys, ...bulk.tagKeys])];
  });

  bulk.recurrenceType = '';
  bulk.categoryKey = '';
  bulk.tagKeys = [];
}

const allSelected = computed(() => filteredRows.value.length > 0 && filteredRows.value.every((row) => row.create));
const someSelected = computed(() => filteredRows.value.some((row) => row.create) && !allSelected.value);

function toggleAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;

  filteredRows.value.forEach((row) => {
    row.create = checked;
  });
}

// Only selected rows are validated; ignored rows (`create: false`) are always valid.
const hasInvalidRows = computed(() => rows.value.some((row) => row.create && !isRowValid(row)));
const selectedCount = computed(() => rows.value.filter((row) => row.create).length);
const processedCount = computed(() => Object.keys(results.value).length);
const progress = computed(() => (totalRows.value ? Math.min(100, Math.round((processedCount.value / totalRows.value) * 100)) : 0));
const finished = computed(() => importing.value && totalRows.value > 0 && processedCount.value >= totalRows.value);
const createdCount = computed(() => Object.values(results.value).filter((event) => event.status === 'created').length);
const failedCount = computed(() => Object.values(results.value).filter((event) => event.status === 'error').length);

function handleEvent(event: TransactionImportEvent) {
  if (event.stage !== 'import' || event.importId !== importStore.importId) return;

  results.value = { ...results.value, [event.row]: event };
}

async function loadOptions() {
  const [categories, tags] = await Promise.all([
    listCategories({ perPage: 100, sort: 'name asc', filters: { activeEq: true } }).catch(() => null),
    listTags({ perPage: 100, sort: 'name asc', filters: { activeEq: true } }).catch(() => null),
  ]);

  categoryItems.value = [
    ...(categories?.categories ?? []).map((category) => ({ key: category.id, label: category.name, color: category.color })),
    ...newOptionsFromPreview(importStore.rows, 'category'),
  ];
  tagItems.value = [
    ...(tags?.tags ?? []).map((tag) => ({ key: tag.id, label: tag.name, color: tag.color })),
    ...newOptionsFromPreview(importStore.rows, 'tags'),
  ];
}

// Every row shares the same account/card, so the first row is enough to resolve its name.
async function loadDestinationName() {
  const { accountId, creditCardId } = importStore.rows[0] ?? {};

  try {
    if (creditCardId) destinationName.value = (await getCreditCard(creditCardId)).name;
    else if (accountId) destinationName.value = (await getAccount(accountId)).name;
  } catch {
    destinationName.value = '';
  }
}

async function submit() {
  if (importing.value || hasInvalidRows.value || !importStore.importId) return;

  importing.value = true;
  results.value = {};
  // The total is the selection itself, so the bar shows up (and tracks events) before the server answers.
  totalRows.value = selectedCount.value;

  try {
    await confirmTransactionImport({
      importId: importStore.importId,
      rows: rows.value.filter((row) => row.create).map(confirmRowFromForm),
    });
  } catch (error) {
    importing.value = false;
    totalRows.value = 0;
    notifyApiError(error);
  }
}

function rowClass(row: TransactionImportRowForm) {
  const status = results.value[row.row]?.status;

  return {
    'is-ignored': !row.create,
    'is-created': status === 'created',
    'is-failed': status === 'error',
    'is-skipped': status === 'skip',
  };
}

function rowTitle(row: TransactionImportRowForm): string | undefined {
  const event = results.value[row.row];

  if (!event) return undefined;

  return event.error ?? t(`transactions.importPage.statuses.${event.status}`);
}

onMounted(() => {
  if (!importStore.importId || importStore.rows.length === 0) {
    void router.replace({ name: 'transactions' });
    return;
  }

  rows.value = importStore.rows.map(rowFormFromPreview);
  unsubscribe = subscribeTransactionImport(handleEvent);
  void loadOptions();
  void loadDestinationName();
});

onUnmounted(() => {
  unsubscribe?.();
  importStore.reset();
});
</script>

<template>
  <div class="columns">
    <div class="column import-column">
      <NotificationMessage />

      <nav class="panel">
        <p class="panel-heading">
          <span class="panel-heading-title">{{ t('transactions.importPage.title') }}</span>
          <span v-if="summary" class="tags">
            <span class="tag is-info is-light">{{ kindLabel }}</span>
            <span class="tag is-info is-light">{{ paymentMethodLabel }}</span>
            <span v-if="destinationName" class="tag is-info is-light">{{ destinationName }}</span>
          </span>
        </p>

        <div class="panel-block bulk-block">
          <div class="bulk-field">
            <Select
              v-model="bulk.recurrenceType"
              name="bulkRecurrenceType"
              :placeholder="t('transactions.form.recurrenceTypePlaceholder')"
              :items="recurrenceTypeItems"
              :disabled="importing"
            />
          </div>
          <div class="bulk-field">
            <ColorSelect
              clearable
              v-model="bulk.categoryKey"
              name="bulkCategory"
              :placeholder="t('transactions.form.categoryIdPlaceholder')"
              :items="categoryItems"
              :disabled="importing"
            />
          </div>
          <div class="bulk-field">
            <SelectMultiple
              v-model="bulk.tagKeys"
              name="bulkTags"
              :placeholder="t('transactions.form.tagIdsPlaceholder')"
              :items="tagItems"
              :disabled="importing"
            />
          </div>
          <button type="button" class="button is-info" :disabled="importing || !hasBulkValues || bulkTargets.length === 0" @click="applyBulk">
            {{ t('transactions.importPage.applyToSelected', { count: bulkTargets.length }) }}
          </button>
        </div>

        <div class="panel-block table-block">
          <div class="table-container">
            <table class="table is-bordered is-striped is-fullwidth">
              <thead>
                <tr class="table-filters">
                  <td class="col-create"></td>
                  <td>
                    <Calendar v-model="filters.date" name="filterDate" />
                  </td>
                  <td>
                    <InputText v-model="filters.description" name="filterDescription" :errors="[]" :placeholder="t('filters.byDescription')" />
                  </td>
                  <td>
                    <InputText v-model="filters.amount" name="filterAmount" :errors="[]" :placeholder="t('transactions.form.value')" />
                  </td>
                  <td>
                    <Select
                      v-model="filters.recurrenceType"
                      name="filterRecurrenceType"
                      :placeholder="t('filters.byRecurrenceType')"
                      :items="recurrenceTypeItems"
                    />
                  </td>
                  <td>
                    <Calendar v-model="filters.endsOn" name="filterEndsOn" />
                  </td>
                  <td>
                    <ColorSelect
                      clearable
                      v-model="filters.categoryKey"
                      name="filterCategory"
                      :placeholder="t('transactions.form.categoryIdPlaceholder')"
                      :items="categoryFilterItems"
                    />
                  </td>
                  <td>
                    <SelectMultiple
                      v-model="filters.tagKeys"
                      name="filterTags"
                      :placeholder="t('transactions.form.tagIdsPlaceholder')"
                      :items="tagFilterItems"
                    />
                  </td>
                </tr>
                <tr>
                  <th class="col-create">
                    <input
                      type="checkbox"
                      :checked="allSelected"
                      :indeterminate="someSelected"
                      :disabled="importing"
                      :title="t('transactions.importPage.selectAll')"
                      @change="toggleAll"
                    />
                  </th>
                  <th class="col-date">{{ t('transactions.form.date') }}</th>
                  <th class="col-description">{{ t('transactions.form.description') }}</th>
                  <th class="col-amount">{{ t('transactions.form.value') }}</th>
                  <th class="col-recurrence">{{ t('transactions.form.recurrenceType') }}</th>
                  <th class="col-date">{{ t('transactions.form.endsOn') }}</th>
                  <th class="col-category">{{ t('transactions.form.categoryId') }}</th>
                  <th class="col-tags">{{ t('transactions.form.tagIds') }}</th>
                </tr>
              </thead>

              <tbody>
                <template v-for="row in pagedRows" :key="row.row">
                  <tr :class="rowClass(row)" :title="rowTitle(row)">
                    <td class="col-create">
                      <CheckBox v-model="row.create" :name="`create-${row.row}`" :disabled="importing" />
                    </td>
                    <td>
                      <Calendar
                        v-model="row.date"
                        :name="`date-${row.row}`"
                        :disabled="importing || !row.create"
                        :error="row.create && !row.date ? t('required') : ''"
                      />
                    </td>
                    <td>
                      <InputText
                        v-model="row.description"
                        :name="`description-${row.row}`"
                        :disabled="importing || !row.create"
                        :errors="row.create && !row.description.trim() ? [t('required')] : []"
                      />
                    </td>
                    <td>
                      <InputNumeric
                        v-model="row.amount"
                        :name="`amount-${row.row}`"
                        :disabled="importing || !row.create"
                        :error="row.create && row.amount == null ? t('required') : ''"
                      />
                    </td>
                    <td>
                      <Select
                        v-model="row.recurrenceType"
                        :name="`recurrenceType-${row.row}`"
                        :items="recurrenceTypeItems"
                        :disabled="importing || !row.create"
                        @update:model-value="resetRecurrenceFields(row)"
                      />
                      <template v-if="row.recurrenceType === 'installment'">
                        <Select
                          v-model="row.limitConsumptionType"
                          :name="`limitConsumptionType-${row.row}`"
                          :placeholder="t('transactions.form.limitConsumptionTypePlaceholder')"
                          :items="limitConsumptionTypeItems"
                          :disabled="importing || !row.create"
                          :error="row.create && !row.limitConsumptionType ? t('required') : ''"
                        />
                        <InputNumber
                          v-model="row.installmentsCount"
                          :name="`installmentsCount-${row.row}`"
                          :placeholder="t('transactions.form.installmentsCount')"
                          :min-value="2"
                          :max-length="4"
                          :disabled="importing || !row.create"
                          :error="row.create && (row.installmentsCount ?? 0) <= 1 ? t('transactions.errors.installmentsCountGreaterThanOne') : ''"
                        />
                      </template>
                    </td>
                    <td>
                      <Calendar
                        v-model="row.endsOn"
                        :name="`endsOn-${row.row}`"
                        :disabled="importing || !row.create || row.recurrenceType !== 'recurring'"
                      />
                    </td>
                    <td>
                      <ColorSelect
                        clearable
                        v-model="row.categoryKey"
                        :name="`category-${row.row}`"
                        :placeholder="t('transactions.form.categoryIdPlaceholder')"
                        :items="categoryItems"
                        :disabled="importing || !row.create"
                        :error="row.create && !row.categoryKey ? t('required') : ''"
                      />
                    </td>
                    <td>
                      <SelectMultiple
                        v-model="row.tagKeys"
                        :name="`tags-${row.row}`"
                        :placeholder="t('transactions.form.tagIdsPlaceholder')"
                        :items="tagItems"
                        :disabled="importing || !row.create"
                      />
                    </td>
                  </tr>
                  <tr v-if="results[row.row]?.status === 'error'" class="row-error">
                    <td colspan="8" class="has-text-danger">
                      <i class="fas fa-circle-exclamation"></i>
                      {{ results[row.row]?.error ?? t('transactions.importPage.statuses.error') }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="filteredRows.length > PAGE_SIZE" class="panel-block paginator-block">
          <Paginator :pagination="pagination" @change:page="page = $event" />
        </div>

        <div class="panel-block footer-block">
          <div v-if="importing && totalRows > 0" class="progress-area">
            <progress class="progress" :class="finished ? (failedCount ? 'is-warning' : 'is-success') : 'is-info'" :value="progress" max="100">
              {{ progress }}%
            </progress>
            <p class="help">
              {{ t('transactions.importPage.progress', { processed: processedCount, total: totalRows, percent: progress }) }}
              <template v-if="finished">
                · {{ t('transactions.importPage.created', { count: createdCount }) }}
                <span v-if="failedCount > 0" class="has-text-danger">· {{ t('transactions.import.failed', { count: failedCount }) }}</span>
              </template>
            </p>
          </div>
          <p v-else-if="hasInvalidRows" class="help is-danger">{{ t('transactions.importPage.invalidRows') }}</p>

          <div class="footer-actions">
            <router-link class="button" :to="{ name: 'transactions' }">{{
              finished ? t('transactions.importPage.backToTransactions') : t('buttons.back')
            }}</router-link>
            <button
              v-if="!finished"
              type="button"
              class="button is-link"
              :class="{ 'is-loading': importing && !totalRows }"
              :disabled="importing || hasInvalidRows || selectedCount === 0"
              @click="submit"
            >
              {{ t('transactions.importPage.submit', { count: selectedCount }) }}
            </button>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
/* Flex items default to min-width: auto, so the wide table would stretch the column past the viewport instead of scrolling. */
.import-column {
  min-width: 0;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.bulk-block {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.bulk-field {
  flex: 1;
  min-width: 200px;
}

.table-block {
  display: block;
}

.table-container {
  width: 100%;
}

.table td,
.table th {
  vertical-align: middle;
}

.table .col-create {
  text-align: center;
}

.table td > * + * {
  margin-top: 0.5rem;
}

.col-create {
  width: 1%;
  white-space: nowrap;
}

.col-date {
  min-width: 135px;
}

.col-description {
  min-width: 180px;
}

.col-amount {
  min-width: 125px;
}

.col-recurrence {
  min-width: 140px;
}

.col-category,
.col-tags {
  min-width: 180px;
}

.is-ignored {
  opacity: 0.55;
}

.is-created td {
  background-color: #effaf3;
}

.is-failed td {
  background-color: #feecf0;
}

.row-error td {
  background-color: #feecf0;
  font-size: 0.875rem;
}

.is-skipped td {
  background-color: #fffaeb;
}

/* Paginator floats its children; flow-root makes the block contain them. */
.paginator-block {
  display: flow-root;
}

.footer-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.progress-area {
  flex: 1;
  min-width: 220px;
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}
</style>

<style>
/* #app caps every page at 1280px; this screen needs more room for all columns. */
#app:has(.import-column) {
  max-width: 1800px;
}
</style>
