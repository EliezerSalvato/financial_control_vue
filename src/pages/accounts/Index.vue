<script setup lang="ts">
import type { Pagination } from '@/types/api';
import type { Account, AccountKind, BankAccountType } from '@/types/account';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { booleanFilterValue, parseActiveQuery, queryString, useIndexListQuery } from '@/composables/useIndexListQuery';
import { deleteAccount, listAccounts } from '@/api/accounts';
import { formatCurrency, signedAmountClass } from '@/utils/money';
import { notifyApiError } from '@/utils/notifyApiError';
import { computed, reactive, ref } from 'vue';
import IndexPanel from '@/components/IndexPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import Select from '@/components/inputs/Select.vue';

const BANK_ACCOUNT_TYPES = new Set<BankAccountType>(['checking', 'savings', 'investment', 'salary']);

type SortField = 'name' | 'kind' | 'bank_account_type' | 'current_balance' | 'active';

const { t, locale } = useI18n();
const notificationStore = useNotificationStore();

const items = ref<Account[]>([]);
const pagination = ref<Pagination | null>(null);

const filters = reactive({
  name: '',
  kind: '' as string | null,
  bankAccountType: '' as string | null,
  active: '' as string | null,
});

const activationTypes = computed(() => ({
  true: t('activation.active'),
  false: t('activation.inactive'),
}));

const kindTypes = computed(() => ({
  bank_account: t('accounts.kinds.bankAccount'),
  cash: t('accounts.kinds.cash'),
}));

const bankAccountTypes = computed(() => ({
  checking: t('accounts.bankAccountTypes.checking'),
  savings: t('accounts.bankAccountTypes.savings'),
  investment: t('accounts.bankAccountTypes.investment'),
  salary: t('accounts.bankAccountTypes.salary'),
}));

function isBankAccountType(value: string): value is BankAccountType {
  return BANK_ACCOUNT_TYPES.has(value as BankAccountType);
}

const { showLoading, showTableLoading, sortDirection, toggleSort, changePage, filterChange, createDebouncedFilter } = useIndexListQuery({
  routeName: 'accounts',
  sortableFields: ['name', 'kind', 'bank_account_type', 'current_balance', 'active'] as const satisfies readonly SortField[],
  extraQuery: () => {
    const query: Record<string, string> = {};

    if (filters.name.trim()) {
      query.name = filters.name;
    }

    if (filters.kind === 'bank_account' || filters.kind === 'cash') {
      query.kind = filters.kind;
    }

    if (filters.bankAccountType && isBankAccountType(filters.bankAccountType)) {
      query.bankAccountType = filters.bankAccountType;
    }

    if (filters.active === 'true' || filters.active === 'false') {
      query.active = filters.active;
    }

    return query;
  },
  applyExtraQuery: (query) => {
    filters.name = queryString(query.name);

    const kind = queryString(query.kind);
    filters.kind = kind === 'bank_account' || kind === 'cash' ? kind : '';

    const bankAccountType = queryString(query.bankAccountType);
    filters.bankAccountType = isBankAccountType(bankAccountType) ? bankAccountType : '';

    filters.active = parseActiveQuery(query.active);
  },
  load: async ({ page, perPage, sort }) => {
    const kindEq = filters.kind === 'bank_account' || filters.kind === 'cash' ? (filters.kind as AccountKind) : undefined;
    const bankAccountTypeEq = filters.bankAccountType && isBankAccountType(filters.bankAccountType) ? filters.bankAccountType : undefined;
    const result = await listAccounts({
      page,
      perPage,
      sort,
      filters: {
        nameCont: filters.name.trim() || undefined,
        kindEq,
        bankAccountTypeEq,
        activeEq: booleanFilterValue(filters.active),
      },
    });

    items.value = result.accounts;
    pagination.value = result.pagination;
  },
});

const filterNameChange = createDebouncedFilter();

function kindLabel(kind: AccountKind) {
  return kind === 'bank_account' ? t('accounts.kinds.bankAccount') : t('accounts.kinds.cash');
}

function bankAccountTypeLabel(type: Account['bankAccountType']) {
  if (!type) return '—';

  return t(`accounts.bankAccountTypes.${type}`);
}

async function deleteItem(itemId: string) {
  try {
    const response = await deleteAccount(itemId);
    await changePage(1);
    notificationStore.setCurrentMessage(response.message, 'success');
  } catch (error) {
    notifyApiError(error);
  }
}
</script>

<template>
  <IndexPanel
    model-name="account"
    btn-new-gender="female"
    :items="items"
    :item-label="(item) => item.name"
    :pagination="pagination"
    :show-loading="showLoading"
    :show-table-loading="showTableLoading"
    @change:page="changePage"
    @delete:item="deleteItem"
  >
    <template #table-filters>
      <td class="color"></td>
      <td>
        <InputText v-model="filters.name" name="name" :errors="[]" :placeholder="t('filters.byName')" @change:value="filterNameChange" />
      </td>
      <td class="is-hidden-mobile">
        <Select v-model="filters.kind" name="kind" :placeholder="t('filters.byKind')" :items="kindTypes" @change:selected="filterChange" />
      </td>
      <td class="bank-account-type is-hidden-mobile">
        <Select
          v-model="filters.bankAccountType"
          name="bankAccountType"
          :placeholder="t('filters.byBankAccountType')"
          :items="bankAccountTypes"
          @change:selected="filterChange"
        />
      </td>
      <td class="is-hidden-mobile"></td>
      <td class="is-hidden-mobile">
        <Select
          v-model="filters.active"
          name="active"
          :placeholder="t('filters.byActive')"
          :items="activationTypes"
          @change:selected="filterChange"
        />
      </td>
    </template>

    <template #table-header>
      <th class="color">{{ t('accounts.columns.color') }}</th>
      <th class="sortable" @click="toggleSort('name')">
        <span class="sortable-label">
          {{ t('accounts.columns.name') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('name') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('name') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable is-hidden-mobile" @click="toggleSort('kind')">
        <span class="sortable-label">
          {{ t('accounts.columns.kind') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('kind') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('kind') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable bank-account-type is-hidden-mobile" @click="toggleSort('bank_account_type')">
        <span class="sortable-label">
          {{ t('accounts.columns.bankAccountType') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('bank_account_type') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('bank_account_type') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable balance is-hidden-mobile" @click="toggleSort('current_balance')">
        <span class="sortable-label">
          {{ t('accounts.columns.currentBalance') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('current_balance') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('current_balance') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable active is-hidden-mobile" @click="toggleSort('active')">
        <span class="sortable-label">
          {{ t('accounts.columns.active') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('active') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('active') === 'desc' }"></i>
          </span>
        </span>
      </th>
    </template>

    <template #table-item-start="{ item }">
      <td class="color">
        <span class="account-color" :title="item.color ?? undefined" :style="{ backgroundColor: item.color ?? undefined }"></span>
      </td>
    </template>

    <template #table-item="{ item }">
      <td class="is-hidden-mobile">{{ kindLabel(item.kind) }}</td>
      <td class="bank-account-type is-hidden-mobile">{{ bankAccountTypeLabel(item.bankAccountType) }}</td>
      <td class="balance is-hidden-mobile" :class="signedAmountClass(item.currentBalance)">{{ formatCurrency(item.currentBalance, locale) }}</td>
      <td class="is-hidden-mobile">
        <span class="icon">
          <i class="fas" :class="item.active ? 'fa-check has-text-success' : 'fa-times has-text-danger'"></i>
        </span>
      </td>
    </template>
  </IndexPanel>
</template>
<style scoped>
.active {
  min-width: 175px;
}

.bank-account-type {
  min-width: 210px;
}

.balance {
  min-width: 140px;
  text-align: right;
}

.color {
  width: 1%;
  white-space: nowrap;
}

.account-color {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  vertical-align: middle;
}
</style>
