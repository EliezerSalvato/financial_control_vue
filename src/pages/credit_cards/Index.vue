<script setup lang="ts">
import type { Pagination } from '@/types/api';
import type { CreditCard } from '@/types/credit_card';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { booleanFilterValue, parseActiveQuery, queryString, useIndexListQuery } from '@/composables/useIndexListQuery';
import { deleteCreditCard, listCreditCards } from '@/api/credit_cards';
import { formatCurrency, signedAmountClass } from '@/utils/money';
import { networkLogoUrl } from '@/utils/networkLogos';
import { notifyApiError } from '@/utils/notifyApiError';
import { computed, reactive, ref } from 'vue';
import IndexPanel from '@/components/IndexPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import Select from '@/components/inputs/Select.vue';

type SortField = 'name' | 'network' | 'total_limit' | 'available_limit' | 'active';

const { t, locale } = useI18n();
const notificationStore = useNotificationStore();

const items = ref<CreditCard[]>([]);
const pagination = ref<Pagination | null>(null);

const filters = reactive({
  name: '',
  network: '',
  active: '' as string | null,
});

const activationTypes = computed(() => ({
  true: t('activation.active'),
  false: t('activation.inactive'),
}));

const { showLoading, showTableLoading, sortDirection, toggleSort, changePage, filterChange, createDebouncedFilter } = useIndexListQuery({
  routeName: 'creditCards',
  sortableFields: ['name', 'network', 'total_limit', 'available_limit', 'active'] as const satisfies readonly SortField[],
  extraQuery: () => {
    const query: Record<string, string> = {};

    if (filters.name.trim()) {
      query.name = filters.name;
    }

    if (filters.network.trim()) {
      query.network = filters.network;
    }

    if (filters.active === 'true' || filters.active === 'false') {
      query.active = filters.active;
    }

    return query;
  },
  applyExtraQuery: (query) => {
    filters.name = queryString(query.name);
    filters.network = queryString(query.network);
    filters.active = parseActiveQuery(query.active);
  },
  load: async ({ page, perPage, sort }) => {
    const result = await listCreditCards({
      page,
      perPage,
      sort,
      filters: {
        nameCont: filters.name.trim() || undefined,
        networkCont: filters.network.trim() || undefined,
        activeEq: booleanFilterValue(filters.active),
      },
    });

    items.value = result.creditCards;
    pagination.value = result.pagination;
  },
});

const filterNameChange = createDebouncedFilter();

async function deleteItem(itemId: string) {
  try {
    const response = await deleteCreditCard(itemId);
    await changePage(1);
    notificationStore.setCurrentMessage(response.message, 'success');
  } catch (error) {
    notifyApiError(error);
  }
}
</script>

<template>
  <IndexPanel
    model-name="credit_card"
    btn-new-gender="male"
    :items="items"
    :item-label="(item) => item.name"
    :pagination="pagination"
    :show-loading="showLoading"
    :show-table-loading="showTableLoading"
    @change:page="changePage"
    @delete:item="deleteItem"
  >
    <template #table-filters>
      <td class="logo"></td>
      <td>
        <InputText v-model="filters.name" name="name" :errors="[]" :placeholder="t('filters.byName')" @change:value="filterNameChange" />
      </td>
      <td class="is-hidden-mobile"></td>
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
      <th class="logo">{{ t('creditCards.columns.network') }}</th>
      <th class="sortable" @click="toggleSort('name')">
        <span class="sortable-label">
          {{ t('creditCards.columns.name') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('name') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('name') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable limit is-hidden-mobile" @click="toggleSort('total_limit')">
        <span class="sortable-label">
          {{ t('creditCards.columns.totalLimit') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('total_limit') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('total_limit') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable limit is-hidden-mobile" @click="toggleSort('available_limit')">
        <span class="sortable-label">
          {{ t('creditCards.columns.availableLimit') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('available_limit') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('available_limit') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable active is-hidden-mobile" @click="toggleSort('active')">
        <span class="sortable-label">
          {{ t('creditCards.columns.active') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('active') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('active') === 'desc' }"></i>
          </span>
        </span>
      </th>
    </template>

    <template #table-item-start="{ item }">
      <td class="logo">
        <span v-if="networkLogoUrl(item.network)" class="network-logo">
          <img :src="networkLogoUrl(item.network) ?? undefined" :alt="item.network" :title="item.network" />
        </span>
      </td>
    </template>

    <template #table-item="{ item }">
      <td class="limit is-hidden-mobile">{{ formatCurrency(item.totalLimit, locale) }}</td>
      <td class="limit is-hidden-mobile" :class="signedAmountClass(item.availableLimit)">{{ formatCurrency(item.availableLimit, locale) }}</td>
      <td class="is-hidden-mobile">
        <span class="icon">
          <i class="fas" :class="item.active ? 'fa-check has-text-success' : 'fa-times has-text-danger'"></i>
        </span>
      </td>
    </template>
  </IndexPanel>
</template>

<style scoped>
:deep(.table td),
:deep(.table th) {
  padding: 0.35rem 0.5rem;
  vertical-align: middle;
}

:deep(.table td.logo),
:deep(.table th.logo) {
  padding: 0.15rem;
  line-height: 0;
  text-align: center;
  vertical-align: middle;
}

:deep(.table .delete.is-medium) {
  width: 1.25rem;
  height: 1.25rem;
  max-height: 1.25rem;
  max-width: 1.25rem;
}

.active {
  min-width: 175px;
}

.limit {
  min-width: 140px;
  text-align: right;
}

.day {
  min-width: 110px;
  text-align: center;
}

.logo {
  width: 1%;
  white-space: nowrap;
}

.network-logo {
  display: inline-block;
  width: calc(2.5rem - 2px);
  height: calc(2.5rem - 2px);
  margin: 2px;
  overflow: hidden;
  border-radius: 0.4rem;
  line-height: 0;
  vertical-align: middle;
}

.network-logo img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: contain;
}
</style>
