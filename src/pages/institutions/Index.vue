<script setup lang="ts">
import type { Pagination } from '@/types/api';
import type { Institution } from '@/types/institution';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { booleanFilterValue, parseActiveQuery, queryString, useIndexListQuery } from '@/composables/useIndexListQuery';
import { deleteInstitution, listInstitutions } from '@/api/institutions';
import { institutionLogoUrl } from '@/utils/institutionLogos';
import { notifyApiError } from '@/utils/notifyApiError';
import { computed, reactive, ref } from 'vue';
import IndexPanel from '@/components/IndexPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import Select from '@/components/inputs/Select.vue';

type SortField = 'name' | 'active';

const { t } = useI18n();
const notificationStore = useNotificationStore();

const items = ref<Institution[]>([]);
const pagination = ref<Pagination | null>(null);

const filters = reactive({
  name: '',
  active: '' as string | null,
});

const activationTypes = computed(() => ({
  true: t('activation.active'),
  false: t('activation.inactive'),
}));

const { showLoading, showTableLoading, sortDirection, toggleSort, changePage, filterChange, createDebouncedFilter } = useIndexListQuery({
  routeName: 'institutions',
  sortableFields: ['name', 'active'] as const satisfies readonly SortField[],
  extraQuery: () => {
    const query: Record<string, string> = {};

    if (filters.name.trim()) {
      query.name = filters.name;
    }

    if (filters.active === 'true' || filters.active === 'false') {
      query.active = filters.active;
    }

    return query;
  },
  applyExtraQuery: (query) => {
    filters.name = queryString(query.name);
    filters.active = parseActiveQuery(query.active);
  },
  load: async ({ page, perPage, sort }) => {
    const result = await listInstitutions({
      page,
      perPage,
      sort,
      filters: {
        nameCont: filters.name.trim() || undefined,
        activeEq: booleanFilterValue(filters.active),
      },
    });

    items.value = result.institutions;
    pagination.value = result.pagination;
  },
});

const filterNameChange = createDebouncedFilter();

async function deleteItem(itemId: string) {
  try {
    const response = await deleteInstitution(itemId);
    await changePage(1);
    notificationStore.setCurrentMessage(response.message, 'success');
  } catch (error) {
    notifyApiError(error);
  }
}
</script>

<template>
  <IndexPanel
    model-name="institution"
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
      <td class="logo"></td>
      <td>
        <InputText v-model="filters.name" name="name" :errors="[]" :placeholder="t('filters.byName')" @change:value="filterNameChange" />
      </td>
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
      <th class="logo">{{ t('institutions.columns.logoKey') }}</th>
      <th class="sortable" @click="toggleSort('name')">
        <span class="sortable-label">
          {{ t('institutions.columns.name') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('name') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('name') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable active is-hidden-mobile" @click="toggleSort('active')">
        <span class="sortable-label">
          {{ t('institutions.columns.active') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('active') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('active') === 'desc' }"></i>
          </span>
        </span>
      </th>
    </template>

    <template #table-item-start="{ item }">
      <td class="logo">
        <span v-if="institutionLogoUrl(item.logoKey)" class="institution-logo">
          <img :src="institutionLogoUrl(item.logoKey) ?? undefined" :alt="item.logoKey" :title="item.logoKey" />
        </span>
      </td>
    </template>

    <template #table-item="{ item }">
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

.logo {
  width: 1%;
  white-space: nowrap;
}

.institution-logo {
  display: inline-block;
  width: calc(2.5rem - 2px);
  height: calc(2.5rem - 2px);
  margin: 2px;
  overflow: hidden;
  border-radius: 0.4rem;
  line-height: 0;
  vertical-align: middle;
}

.institution-logo img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
}
</style>
