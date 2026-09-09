<script setup lang="ts">
import type { Pagination } from '@/types/api';
import type { Transaction, TransactionKind, TransactionPaymentMethod, TransactionRecurrenceType, TransactionStatus } from '@/types/transaction';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { queryString, useIndexListQuery } from '@/composables/useIndexListQuery';
import { cancelTransaction, deleteTransaction, listTransactions } from '@/api/transactions';
import { formatCurrency } from '@/utils/money';
import { notifyApiError } from '@/utils/notifyApiError';
import { computed, reactive, ref } from 'vue';
import IndexPanel from '@/components/IndexPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import Select from '@/components/inputs/Select.vue';

const TRANSACTION_KINDS = new Set<TransactionKind>(['income', 'expense', 'transfer_between_accounts']);
const TRANSACTION_STATUSES = new Set<TransactionStatus>(['pending', 'active', 'completed', 'canceled']);
const PAYMENT_METHODS = new Set<TransactionPaymentMethod>(['pix', 'debit', 'credit_card', 'ted', 'doc', 'deposit', 'cash', 'boleto']);
const RECURRENCE_TYPES = new Set<TransactionRecurrenceType>(['one_time', 'installment', 'recurring']);

type SortField = 'description' | 'kind' | 'status' | 'payment_method' | 'recurrence_type' | 'created_at';

const { t, locale } = useI18n();
const notificationStore = useNotificationStore();

const items = ref<Transaction[]>([]);
const pagination = ref<Pagination | null>(null);

const filters = reactive({
  description: '',
  kind: '' as string | null,
  status: '' as string | null,
  paymentMethod: '' as string | null,
  recurrenceType: '' as string | null,
});

const kindTypes = computed(() => ({
  expense: t('transactions.kinds.expense'),
  income: t('transactions.kinds.income'),
  transfer_between_accounts: t('transactions.kinds.transferBetweenAccounts'),
}));

const statusTypes = computed(() => ({
  pending: t('transactions.statuses.pending'),
  active: t('transactions.statuses.active'),
  completed: t('transactions.statuses.completed'),
  canceled: t('transactions.statuses.canceled'),
}));

const paymentMethodTypes = computed(() => ({
  credit_card: t('transactions.paymentMethods.creditCard'),
  pix: t('transactions.paymentMethods.pix'),
  debit: t('transactions.paymentMethods.debit'),
  cash: t('transactions.paymentMethods.cash'),
  boleto: t('transactions.paymentMethods.boleto'),
  deposit: t('transactions.paymentMethods.deposit'),
  ted: t('transactions.paymentMethods.ted'),
  doc: t('transactions.paymentMethods.doc'),
}));

const recurrenceTypes = computed(() => ({
  one_time: t('transactions.recurrenceTypes.oneTime'),
  installment: t('transactions.recurrenceTypes.installment'),
  recurring: t('transactions.recurrenceTypes.recurring'),
}));

function isTransactionKind(value: string): value is TransactionKind {
  return TRANSACTION_KINDS.has(value as TransactionKind);
}

function isTransactionStatus(value: string): value is TransactionStatus {
  return TRANSACTION_STATUSES.has(value as TransactionStatus);
}

function isPaymentMethod(value: string): value is TransactionPaymentMethod {
  return PAYMENT_METHODS.has(value as TransactionPaymentMethod);
}

function isRecurrenceType(value: string): value is TransactionRecurrenceType {
  return RECURRENCE_TYPES.has(value as TransactionRecurrenceType);
}

const { showLoading, showTableLoading, sortDirection, toggleSort, changePage, filterChange, createDebouncedFilter } = useIndexListQuery({
  routeName: 'transactions',
  sortableFields: ['description', 'kind', 'status', 'payment_method', 'recurrence_type', 'created_at'] as const satisfies readonly SortField[],
  extraQuery: () => {
    const query: Record<string, string> = {};

    if (filters.description.trim()) {
      query.description = filters.description;
    }

    if (filters.kind && isTransactionKind(filters.kind)) {
      query.kind = filters.kind;
    }

    if (filters.status && isTransactionStatus(filters.status)) {
      query.status = filters.status;
    }

    if (filters.paymentMethod && isPaymentMethod(filters.paymentMethod)) {
      query.paymentMethod = filters.paymentMethod;
    }

    if (filters.recurrenceType && isRecurrenceType(filters.recurrenceType)) {
      query.recurrenceType = filters.recurrenceType;
    }

    return query;
  },
  applyExtraQuery: (query) => {
    filters.description = queryString(query.description);

    const kind = queryString(query.kind);
    filters.kind = isTransactionKind(kind) ? kind : '';

    const status = queryString(query.status);
    filters.status = isTransactionStatus(status) ? status : '';

    const paymentMethod = queryString(query.paymentMethod);
    filters.paymentMethod = isPaymentMethod(paymentMethod) ? paymentMethod : '';

    const recurrenceType = queryString(query.recurrenceType);
    filters.recurrenceType = isRecurrenceType(recurrenceType) ? recurrenceType : '';
  },
  load: async ({ page, perPage, sort }) => {
    const kindEq = filters.kind && isTransactionKind(filters.kind) ? filters.kind : undefined;
    const statusEq = filters.status && isTransactionStatus(filters.status) ? filters.status : undefined;
    const paymentMethodEq = filters.paymentMethod && isPaymentMethod(filters.paymentMethod) ? filters.paymentMethod : undefined;
    const recurrenceTypeEq = filters.recurrenceType && isRecurrenceType(filters.recurrenceType) ? filters.recurrenceType : undefined;
    const result = await listTransactions({
      page,
      perPage,
      sort,
      filters: {
        descriptionCont: filters.description.trim() || undefined,
        kindEq,
        statusEq,
        paymentMethodEq,
        recurrenceTypeEq,
      },
    });

    items.value = result.transactions;
    pagination.value = result.pagination;
  },
});

const filterDescriptionChange = createDebouncedFilter();

function kindLabel(kind: TransactionKind) {
  if (kind === 'transfer_between_accounts') {
    return t('transactions.kinds.transferBetweenAccounts');
  }

  return t(`transactions.kinds.${kind}`);
}

function statusLabel(status: TransactionStatus) {
  return t(`transactions.statuses.${status}`);
}

function statusTagClass(status: TransactionStatus) {
  switch (status) {
    case 'pending':
      return 'is-warning';
    case 'active':
      return 'is-info';
    case 'completed':
      return 'is-success';
    case 'canceled':
      return 'is-danger';
    default:
      return '';
  }
}

function paymentMethodLabel(method: Transaction['paymentMethod']) {
  if (!method) return '—';

  if (method === 'credit_card') {
    return t('transactions.paymentMethods.creditCard');
  }

  return t(`transactions.paymentMethods.${method}`);
}

function recurrenceTypeLabel(type: TransactionRecurrenceType) {
  if (type === 'one_time') return t('transactions.recurrenceTypes.oneTime');

  if (type === 'installment') return t('transactions.recurrenceTypes.installment');

  return t('transactions.recurrenceTypes.recurring');
}

function deleteConfirm(item: Transaction) {
  if (item.status === 'pending') {
    return;
  }

  const itemName = item.description ? ` "${item.description}"` : '';

  if (item.status === 'active') {
    return {
      message: t('transactions.modalDelete.active', { itemName }),
    };
  }

  return {
    message: t('transactions.modalDelete.forbiddenStatus', {
      itemName,
      status: t(`transactions.statuses.${item.status}`),
    }),
    canConfirm: false,
  };
}

async function deleteItem(itemId: string) {
  try {
    const item = items.value.find((transaction) => transaction.id === itemId);
    const response = item?.status === 'active' ? await cancelTransaction(itemId) : await deleteTransaction(itemId);
    await changePage(1);
    notificationStore.setCurrentMessage(response.message, 'success');
  } catch (error) {
    notifyApiError(error);
  }
}
</script>

<template>
  <IndexPanel
    model-name="transaction"
    btn-new-gender="female"
    :items="items"
    :item-label="(item) => item.description"
    :delete-confirm="deleteConfirm"
    :pagination="pagination"
    :show-loading="showLoading"
    :show-table-loading="showTableLoading"
    @change:page="changePage"
    @delete:item="deleteItem"
  >
    <template #table-filters>
      <td>
        <InputText
          v-model="filters.description"
          name="description"
          :errors="[]"
          :placeholder="t('filters.byDescription')"
          @change:value="filterDescriptionChange"
        />
      </td>
      <td class="is-hidden-mobile">
        <Select v-model="filters.kind" name="kind" :placeholder="t('filters.byKind')" :items="kindTypes" @change:selected="filterChange" />
      </td>
      <td class="payment-method is-hidden-touch">
        <Select
          v-model="filters.paymentMethod"
          name="paymentMethod"
          :placeholder="t('filters.byPaymentMethod')"
          :items="paymentMethodTypes"
          @change:selected="filterChange"
        />
      </td>
      <td class="is-hidden-touch"></td>
      <td class="recurrence-type is-hidden-mobile">
        <Select
          v-model="filters.recurrenceType"
          name="recurrenceType"
          :placeholder="t('filters.byRecurrenceType')"
          :items="recurrenceTypes"
          @change:selected="filterChange"
        />
      </td>
      <td class="status is-hidden-mobile">
        <Select v-model="filters.status" name="status" :placeholder="t('filters.byStatus')" :items="statusTypes" @change:selected="filterChange" />
      </td>
    </template>

    <template #table-header>
      <th class="sortable" @click="toggleSort('description')">
        <span class="sortable-label">
          {{ t('transactions.columns.description') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('description') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('description') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable is-hidden-mobile" @click="toggleSort('kind')">
        <span class="sortable-label">
          {{ t('transactions.columns.kind') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('kind') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('kind') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable payment-method is-hidden-touch" @click="toggleSort('payment_method')">
        <span class="sortable-label">
          {{ t('transactions.columns.paymentMethod') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('payment_method') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('payment_method') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="value is-hidden-touch">{{ t('transactions.columns.value') }}</th>
      <th class="sortable recurrence-type is-hidden-mobile" @click="toggleSort('recurrence_type')">
        <span class="sortable-label">
          {{ t('transactions.columns.recurrenceType') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('recurrence_type') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('recurrence_type') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable status is-hidden-mobile" @click="toggleSort('status')">
        <span class="sortable-label">
          {{ t('transactions.columns.status') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('status') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('status') === 'desc' }"></i>
          </span>
        </span>
      </th>
    </template>

    <template #table-item="{ item }">
      <td class="is-hidden-mobile">{{ kindLabel(item.kind) }}</td>
      <td class="payment-method is-hidden-touch">{{ paymentMethodLabel(item.paymentMethod) }}</td>
      <td class="value is-hidden-touch">{{ formatCurrency(item.currentValue, locale) }}</td>
      <td class="recurrence-type is-hidden-mobile">{{ recurrenceTypeLabel(item.recurrenceType) }}</td>
      <td class="status is-hidden-mobile">
        <span class="tag is-light has-text-weight-bold" :class="statusTagClass(item.status)">{{ statusLabel(item.status) }}</span>
      </td>
    </template>
  </IndexPanel>
</template>

<style scoped>
.status {
  min-width: 130px;
}

.payment-method {
  min-width: 170px;
}

.recurrence-type {
  min-width: 150px;
}

.value {
  min-width: 120px;
  text-align: right;
}
</style>
