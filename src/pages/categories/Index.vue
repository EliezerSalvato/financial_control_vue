<script setup lang="ts">
import type { Pagination } from '@/types/api';
import type { Category } from '@/types/category';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { booleanFilterValue, parseActiveQuery, queryString, useIndexListQuery } from '@/composables/useIndexListQuery';
import { deleteCategory, listCategories } from '@/api/categories';
import { notifyApiError } from '@/utils/notifyApiError';
import { computed, reactive, ref } from 'vue';
import IndexPanel from '@/components/IndexPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import Select from '@/components/inputs/Select.vue';

type SortField = 'name' | 'active';

const { t } = useI18n();
const notificationStore = useNotificationStore();

const items = ref<Category[]>([]);
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
  routeName: 'categories',
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
    const result = await listCategories({
      page,
      perPage,
      sort,
      filters: {
        nameCont: filters.name.trim() || undefined,
        activeEq: booleanFilterValue(filters.active),
      },
    });

    items.value = result.categories;
    pagination.value = result.pagination;
  },
});

const filterNameChange = createDebouncedFilter();

async function deleteItem(itemId: string) {
  try {
    const response = await deleteCategory(itemId);
    await changePage(1);
    notificationStore.setCurrentMessage(response.message, 'success');
  } catch (error) {
    notifyApiError(error);
  }
}
</script>

<template>
  <IndexPanel
    model-name="category"
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
      <th class="color">{{ t('categories.columns.color') }}</th>
      <th class="sortable" @click="toggleSort('name')">
        <span class="sortable-label">
          {{ t('categories.columns.name') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('name') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('name') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable active is-hidden-mobile" @click="toggleSort('active')">
        <span class="sortable-label">
          {{ t('categories.columns.active') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('active') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('active') === 'desc' }"></i>
          </span>
        </span>
      </th>
    </template>

    <template #table-item-start="{ item }">
      <td class="color">
        <span class="category-color" :title="item.color ?? undefined" :style="{ backgroundColor: item.color ?? undefined }"></span>
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
.active {
  min-width: 175px;
}

.color {
  width: 1%;
  white-space: nowrap;
}

.category-color {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  vertical-align: middle;
}
</style>
