<script setup lang="ts" generic="T extends { id: string }">
import type { Pagination } from '@/types/api';
import { useI18n } from 'vue-i18n';
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import ButtonNew from '@/components/inputs/ButtonNew.vue';
import Loading from '@/components/Loading.vue';
import ModalDelete from '@/components/ModalDelete.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import Paginator from '@/components/Paginator.vue';
import { pluralize } from '@/utils/pluralize';

const props = withDefaults(
  defineProps<{
    modelName: string;
    btnNewGender: 'male' | 'female';
    items: T[];
    itemLabel: (item: T) => string;
    pagination?: Pagination | null;
    showLoading?: boolean;
    showTableLoading?: boolean;
    deleteConfirm?: (item: T) => { message?: string; canConfirm?: boolean } | undefined;
  }>(),
  {
    showLoading: false,
    showTableLoading: false,
    pagination: null,
  },
);

const emit = defineEmits<{
  'change:page': [page: number];
  'delete:item': [itemId: string];
}>();

const { t, locale } = useI18n();

const itemIdToDelete = ref<string>('');
const itemNameToDelete = ref<string | null>(null);
const deleteMessage = ref<string | null>(null);
const canConfirmDelete = ref(true);
const isDeleteModalOpen = ref(false);
const tableEl = useTemplateRef<HTMLTableElement>('tableEl');
const filtersRow = useTemplateRef<HTMLTableRowElement>('filtersRow');
const headersRow = useTemplateRef<HTMLTableRowElement>('headersRow');

const MIN_COLUMN_WIDTH = 120;
let syncing = false;

function contentWidth(el: HTMLElement): number {
  const label = el.querySelector('.sortable-label');

  if (label instanceof HTMLElement) {
    const previous = label.style.whiteSpace;
    label.style.whiteSpace = 'nowrap';
    const width = Math.round(label.getBoundingClientRect().width);
    label.style.whiteSpace = previous;
    return width;
  }

  if (!el.getClientRects().length) {
    return 0;
  }

  const previous = el.style.whiteSpace;
  el.style.whiteSpace = 'nowrap';

  const range = document.createRange();
  range.selectNodeContents(el);
  const width = Math.round(range.getBoundingClientRect().width);

  el.style.whiteSpace = previous;

  return width;
}

function horizontalChrome(el: HTMLElement): number {
  const style = getComputedStyle(el);

  return (
    Number.parseFloat(style.paddingLeft) +
    Number.parseFloat(style.paddingRight) +
    Number.parseFloat(style.borderLeftWidth) +
    Number.parseFloat(style.borderRightWidth)
  );
}

function cssMinWidth(el: HTMLElement): number {
  const value = Number.parseFloat(getComputedStyle(el).minWidth);

  return Number.isFinite(value) ? Math.ceil(value) : 0;
}

function bodyColumnWidth(columnIndex: number): number {
  const rows = tableEl.value?.tBodies[0]?.rows;

  if (!rows) {
    return 0;
  }

  let max = 0;

  for (const row of rows) {
    const cell = row.cells[columnIndex];

    if (!cell || cell.classList.contains('actions') || cell.colSpan > 1) {
      continue;
    }

    max = Math.max(max, contentWidth(cell));
  }

  return max;
}

function flexibleColumnIndex(): number {
  const labeled = tableEl.value?.tBodies[0]?.querySelector('td.item-label');

  if (labeled instanceof HTMLTableCellElement && labeled.cellIndex >= 0) {
    return labeled.cellIndex;
  }

  const filters = filtersRow.value?.children;

  if (!filters) {
    return 0;
  }

  for (let index = 0; index < filters.length; index++) {
    const cell = filters[index];

    if (cell instanceof HTMLElement && cell.querySelector('.field')) {
      return index;
    }
  }

  return 0;
}

function applyCellWidth(el: HTMLElement, width: number | null, flexible = false) {
  el.classList.toggle('is-flexible', flexible);

  if (flexible) {
    el.style.width = width != null && width > 0 ? `${width}px` : '100%';
    el.style.maxWidth = '';
    return;
  }

  const value = width != null && width > 0 ? `${width}px` : '';
  el.style.width = value;
  el.style.maxWidth = value;
}

function columnWidth(th: HTMLElement, td: HTMLElement, index: number): number {
  const content = Math.max(contentWidth(th), bodyColumnWidth(index));
  const hasFilter = Boolean(td.querySelector('.custom-select, .field'));
  const min = hasFilter ? MIN_COLUMN_WIDTH : 0;

  return Math.max(Math.round(content + horizontalChrome(th)), cssMinWidth(th), min);
}

function actionsColumnWidth(): number {
  const cells = tableEl.value?.querySelectorAll('.actions');

  if (!cells?.length) {
    return 0;
  }

  let max = 0;

  for (const cell of cells) {
    if (cell instanceof HTMLElement) {
      max = Math.max(max, Math.round(cell.getBoundingClientRect().width));
    }
  }

  return max;
}

function flexibleMinWidth(th: HTMLElement): number {
  return Math.max(Math.round(contentWidth(th) + horizontalChrome(th)), cssMinWidth(th), MIN_COLUMN_WIDTH);
}

function syncColumnWidths() {
  if (syncing) {
    return;
  }

  const table = tableEl.value;
  const filterCells = filtersRow.value?.children;
  const headerCells = headersRow.value?.children;

  if (!table || !filterCells || !headerCells) {
    return;
  }

  syncing = true;

  const count = Math.min(filterCells.length, headerCells.length);
  const flexibleIndex = flexibleColumnIndex();
  const widths: Array<number | null> = [];
  let used = 0;

  for (let index = 0; index < count; index++) {
    const td = filterCells[index];
    const th = headerCells[index];

    if (!(td instanceof HTMLElement) || !(th instanceof HTMLElement)) {
      widths.push(null);
      continue;
    }

    if (td.classList.contains('actions') || th.classList.contains('actions') || index === flexibleIndex) {
      widths.push(null);
      continue;
    }

    if (getComputedStyle(th).display === 'none' || getComputedStyle(td).display === 'none') {
      widths.push(null);
      continue;
    }

    const width = columnWidth(th, td, index);
    widths.push(width);
    used += width;
  }

  const flexTd = filterCells[flexibleIndex];
  const flexTh = headerCells[flexibleIndex];
  const remaining = Math.round(table.getBoundingClientRect().width) - used - actionsColumnWidth();
  const flexWidth = flexTd instanceof HTMLElement && flexTh instanceof HTMLElement ? Math.max(flexibleMinWidth(flexTh), remaining) : null;

  for (let index = 0; index < count; index++) {
    const td = filterCells[index];
    const th = headerCells[index];

    if (!(td instanceof HTMLElement) || !(th instanceof HTMLElement)) {
      continue;
    }

    const flexible = index === flexibleIndex;

    applyCellWidth(th, flexible ? flexWidth : (widths[index] ?? null), flexible);
    applyCellWidth(td, flexible ? flexWidth : (widths[index] ?? null), flexible);
  }

  syncing = false;
}

async function refreshColumnWidths() {
  await nextTick();
  syncColumnWidths();
}

const pluralizedName = computed(() => pluralize(props.modelName, 'en').replaceAll('_', '-'));
const pluralizedTitle = computed(() => pluralize(t(`models.${props.modelName}`)));

function changePage(page: number) {
  emit('change:page', page);
}

function openModalDelete(item: T) {
  const options = props.deleteConfirm?.(item);

  itemIdToDelete.value = item.id;
  itemNameToDelete.value = props.itemLabel(item) || null;
  deleteMessage.value = options?.message ?? null;
  canConfirmDelete.value = options?.canConfirm ?? true;
  isDeleteModalOpen.value = true;
}

function deleteItem(itemId: string) {
  isDeleteModalOpen.value = false;
  emit('delete:item', itemId);
}

watch(
  () => [props.showLoading, props.showTableLoading, props.items, locale.value] as const,
  () => {
    if (!props.showLoading) {
      void refreshColumnWidths();
    }
  },
);

onMounted(() => {
  window.addEventListener('resize', syncColumnWidths);
  void refreshColumnWidths();
});

onUnmounted(() => {
  window.removeEventListener('resize', syncColumnWidths);
});
</script>

<template>
  <div class="columns">
    <Loading v-show="showLoading" />

    <div v-show="!showLoading" class="column">
      <NotificationMessage />

      <nav class="panel">
        <p class="panel-heading">
          <span class="panel-heading-title">{{ pluralizedTitle }}</span>
          <span class="panel-heading-aside">
            <ButtonNew :name="t(`buttons.new.${btnNewGender}`, { name: t(`models.${modelName}`) })" :route="`/${pluralizedName}/new`" />
          </span>
        </p>
        <div class="panel-block">
          <table ref="tableEl" class="table is-bordered is-striped is-hoverable is-fullwidth">
            <thead>
              <tr ref="filtersRow" class="table-filters">
                <slot name="table-filters" />
                <td class="actions"></td>
              </tr>
              <tr ref="headersRow">
                <slot name="table-header" />
                <th class="actions"></th>
              </tr>
            </thead>

            <tbody>
              <template v-if="!showTableLoading">
                <tr v-for="item in items" :key="item.id">
                  <slot name="table-item-start" :item="item" />

                  <td class="item-label">
                    <router-link :to="`/${pluralizedName}/edit/${item.id}`">
                      {{ itemLabel(item) }}
                    </router-link>
                  </td>

                  <slot name="table-item" :item="item" />

                  <td class="actions">
                    <slot name="table-item-actions" :item="item" />
                    <a class="delete is-medium has-background-danger" @click="openModalDelete(item)"></a>
                  </td>
                </tr>

                <slot name="table-body" />
              </template>

              <ModalDelete
                v-model:open="isDeleteModalOpen"
                :model-name="modelName"
                :gender="btnNewGender"
                :current-item-id="itemIdToDelete"
                :item-name="itemNameToDelete"
                :message="deleteMessage"
                :can-confirm="canConfirmDelete"
                @delete:item="deleteItem"
              />
            </tbody>

            <tfoot>
              <tr>
                <td colspan="99">
                  <Loading v-if="showTableLoading" class="table-loading" />
                  <Paginator v-else :pagination="pagination" @change:page="changePage" />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.columns {
  margin: 0 auto;
  max-width: 1344px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.panel-heading-title {
  text-transform: capitalize;
}

.panel-heading-aside {
  flex-shrink: 0;
}

.actions {
  width: 1%;
  text-align: center;
}

:deep(th) {
  white-space: nowrap;
}

:deep(.sortable) {
  cursor: pointer;
  user-select: none;
}

:deep(.sortable:hover .sortable-label) {
  color: #363636;
}

:deep(.sortable-label) {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  white-space: nowrap;
}

:deep(.sort-icon) {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  line-height: 0.35;
  font-size: 0.7rem;
  color: #c0c0c0;
}

:deep(.sort-icon i) {
  display: block;
  line-height: 0.35;
  height: 0.5em;
  padding-top: 0.15em;
}

:deep(.sort-icon .is-active) {
  color: #00d1b2;
}

.table-filters td:not(.actions):not(.is-flexible) {
  width: 0;
}

.table-filters td.is-flexible,
:deep(th.is-flexible),
:deep(td.item-label) {
  width: 100%;
}

.table-filters :deep(.field),
.table-filters :deep(.control),
.table-filters :deep(.custom-select),
.table-filters :deep(.custom-select-control),
.table-filters :deep(.input) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.table-filters :deep(.field) {
  margin-bottom: 0;
}

:deep(.table-loading) {
  margin: 0.25rem auto 1.75rem;
}
</style>
