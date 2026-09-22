<script setup lang="ts">
import type { GoalTarget, GoalTargetKind, GoalTransaction } from '@/types/goal';
import { useAppLocale } from '@/composables/useAppLocale';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { formatCurrency } from '@/utils/money';
import { formatFrontDate } from '@/locales/locale';
import { goalDiffClass, goalInstallmentLabel, goalRowClass, groupGoalsByKind } from '@/utils/goalGroups';

const props = defineProps<{
  kind: GoalTargetKind;
  targets: GoalTarget[];
  transactions: GoalTransaction[];
}>();

const { t } = useI18n();
const { appLocale } = useAppLocale();
const expandedGroupId = ref<string | null>(null);

const title = computed(() => (props.kind === 'category' ? t('goals.byCategories') : t('goals.byTags')));
const emptyMessage = computed(() => (props.kind === 'category' ? t('goals.emptyCategories') : t('goals.emptyTags')));
const nameColumnLabel = computed(() => (props.kind === 'category' ? t('goals.columns.category') : t('goals.columns.tag')));
const groups = computed(() => groupGoalsByKind(props.kind, props.targets, props.transactions));

function formatValue(value: number) {
  return formatCurrency(value, appLocale.value);
}

function formatPercent(value: number | null) {
  if (value == null) return '';

  return `${new Intl.NumberFormat(appLocale.value, { maximumFractionDigits: 2 }).format(value)}%`;
}

function toggleGroup(id: string) {
  expandedGroupId.value = expandedGroupId.value === id ? null : id;
}
</script>

<template>
  <nav class="items panel">
    <div class="panel-heading">
      <p>{{ title }}</p>
    </div>
    <div class="panel-block">
      <table class="table is-bordered is-striped is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th class="color"></th>
            <th>{{ nameColumnLabel }}</th>
            <th>{{ t('goals.columns.value') }}</th>
            <th>{{ t('goals.columns.goal') }}</th>
            <th>{{ t('goals.columns.diff') }}</th>
            <th colspan="2">{{ t('goals.columns.percent') }}</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="group in groups" :key="group.id">
            <tr :class="goalRowClass(group.percent, group.total, group.transactionKind)">
              <td class="color">
                <span class="target-color" :title="group.color" :style="{ backgroundColor: group.color }"></span>
              </td>
              <td>{{ group.name }}</td>
              <td>{{ formatValue(group.total) }}</td>
              <td>{{ formatValue(group.goal) }}</td>
              <td :class="goalDiffClass(group.diff, group.transactionKind)">{{ formatValue(group.diff) }}</td>
              <td class="goal-percent">{{ formatPercent(group.percent) }}</td>
              <td class="expand-header">
                <button
                  type="button"
                  class="expand"
                  :aria-expanded="expandedGroupId === group.id"
                  :aria-label="expandedGroupId === group.id ? t('goals.collapseGroup') : t('goals.expandGroup')"
                  @click="toggleGroup(group.id)"
                >
                  <i class="fas" :class="expandedGroupId === group.id ? 'fa-chevron-up' : 'fa-chevron-down'" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
            <tr v-if="expandedGroupId === group.id">
              <td colspan="7">
                <table class="table is-bordered is-striped is-hoverable is-fullwidth">
                  <thead>
                    <tr>
                      <th>{{ t('goals.columns.date') }}</th>
                      <th>{{ t('goals.columns.description') }}</th>
                      <th>{{ t('goals.columns.value') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in group.items" :key="item.id">
                      <td>{{ formatFrontDate(item.currentRecurrenceOn, appLocale) }}</td>
                      <td>
                        <router-link :to="{ name: 'transactionsEdit', params: { id: item.id } }">
                          {{ item.description }}{{ goalInstallmentLabel(item) }}
                        </router-link>
                      </td>
                      <td>{{ formatValue(item.value) }}</td>
                    </tr>
                    <tr v-if="!group.items.length">
                      <td colspan="3">{{ t('noResultsFound') }}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
        </tbody>

        <tfoot>
          <tr v-if="!groups.length">
            <td colspan="7">{{ emptyMessage }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </nav>
</template>

<style scoped>
.items {
  display: flex;
  flex-direction: column;
}

.panel-block {
  display: block;
  flex: 1 1 auto;
  padding: 5px !important;
}

.panel-heading {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.panel-heading p {
  flex-grow: 1;
  align-self: center;
}

.color {
  width: 1%;
  white-space: nowrap;
}

.target-color {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  vertical-align: middle;
}

.goal-diff-negative {
  color: #cc0f35;
  font-weight: 600;
}

.goal-diff-positive {
  color: #257953;
  font-weight: 600;
}

.expand-header {
  width: 1px;
}

.expand {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #3273dc;
  color: white;
  width: 20px;
  height: 20px;
  margin: 0 auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

.expand i {
  font-size: 0.65rem;
  -webkit-text-stroke: 0.7px currentColor;
}

.table td,
.table th {
  padding: 5px;
  vertical-align: middle;
}

tr.goal-color-success {
  background-color: #effaf5 !important;
}

tr.goal-color-success:hover {
  background-color: #e2f4ea !important;
}

tr.goal-color-success .goal-percent {
  color: #257953;
  font-weight: 600;
}

tr.goal-color-warning {
  background-color: #fffbeb !important;
}

tr.goal-color-warning:hover {
  background-color: #faf6e6 !important;
}

tr.goal-color-warning .goal-percent {
  color: #947600;
  font-weight: 600;
}

tr.goal-color-danger {
  background-color: #feecf0 !important;
}

tr.goal-color-danger:hover {
  background-color: #f2e1e5 !important;
}

tr.goal-color-danger .goal-percent {
  color: #cc0f35;
  font-weight: 600;
}
</style>
