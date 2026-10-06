<script setup lang="ts">
import type { Pagination } from '@/types/api';
import type { ImportRule } from '@/types/import_rule';
import { notifyApiError } from '@/utils/notifyApiError';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notification';
import { computed, reactive, ref } from 'vue';
import { deleteImportRule, listImportRules } from '@/api/import_rules';
import { booleanFilterValue, parseActiveQuery, queryString, useIndexListQuery } from '@/composables/useIndexListQuery';
import IndexPanel from '@/components/IndexPanel.vue';
import InputText from '@/components/inputs/InputText.vue';
import Select from '@/components/inputs/Select.vue';

type SortField = 'name' | 'position' | 'active';

const { t } = useI18n();
const notificationStore = useNotificationStore();

const items = ref<ImportRule[]>([]);
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
  routeName: 'importRules',
  sortableFields: ['name', 'position', 'active'] as const satisfies readonly SortField[],
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
    const result = await listImportRules({
      page,
      perPage,
      sort,
      filters: {
        nameCont: filters.name.trim() || undefined,
        activeEq: booleanFilterValue(filters.active),
      },
    });

    items.value = result.importRules;
    pagination.value = result.pagination;
  },
});

const filterNameChange = createDebouncedFilter();

function effectsLabel(item: ImportRule) {
  return item.effects.map((effect) => t(`importRules.effectTypes.${effect.effectType}`)).join(', ') || '—';
}

async function deleteItem(itemId: string) {
  try {
    const response = await deleteImportRule(itemId);
    await changePage(1);
    notificationStore.setCurrentMessage(response.message, 'success');
  } catch (error) {
    notifyApiError(error);
  }
}
</script>

<template>
  <IndexPanel
    model-name="import_rule"
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
      <td>
        <InputText v-model="filters.name" name="name" :errors="[]" :placeholder="t('filters.byName')" @change:value="filterNameChange" />
      </td>
      <td class="is-hidden-mobile"></td>
      <td class="is-hidden-touch"></td>
      <td class="position is-hidden-mobile"></td>
      <td class="active is-hidden-mobile">
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
      <th class="sortable" @click="toggleSort('name')">
        <span class="sortable-label">
          {{ t('importRules.columns.name') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('name') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('name') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="is-hidden-mobile">{{ t('importRules.columns.pattern') }}</th>
      <th class="is-hidden-touch">{{ t('importRules.columns.effects') }}</th>
      <th class="sortable position is-hidden-mobile" @click="toggleSort('position')">
        <span class="sortable-label">
          {{ t('importRules.columns.position') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('position') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('position') === 'desc' }"></i>
          </span>
        </span>
      </th>
      <th class="sortable active is-hidden-mobile" @click="toggleSort('active')">
        <span class="sortable-label">
          {{ t('importRules.columns.active') }}
          <span class="sort-icon" aria-hidden="true">
            <i class="fas fa-caret-up" :class="{ 'is-active': sortDirection('active') === 'asc' }"></i>
            <i class="fas fa-caret-down" :class="{ 'is-active': sortDirection('active') === 'desc' }"></i>
          </span>
        </span>
      </th>
    </template>

    <template #table-item="{ item }">
      <td class="is-hidden-mobile">
        <code>{{ item.pattern }}</code>
      </td>
      <td class="is-hidden-touch">{{ effectsLabel(item) }}</td>
      <td class="position is-hidden-mobile">{{ item.position }}</td>
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

.position {
  min-width: 120px;
  text-align: right;
}
</style>
