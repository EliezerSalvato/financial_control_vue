<script setup lang="ts">
import type { InvoiceSettlement } from '@/types/credit_card';
import type { SettledTransaction } from '@/types/transaction';
import type { MonthlyStatement, MonthlyStatementPaymentMethod } from '@/types/monthly_statement';
import { installmentLabel } from '@/utils/installmentLabel';
import { institutionLogoUrl } from '@/utils/institutionLogos';
import { networkLogoUrl } from '@/utils/networkLogos';
import { settledOnForInvoice } from '@/utils/settledInvoice';
import { settledOnForOccurrence } from '@/utils/settledOccurrence';
import { useAppLocale } from '@/composables/useAppLocale';
import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import { formatCurrency } from '@/utils/money';
import { formatFrontDate } from '@/locales/locale';
import ButtonNew from '@/components/inputs/ButtonNew.vue';
import SettledCheck from '@/pages/monthly_statements/SettledCheck.vue';

type ResourceGroup = {
  resourceId: string;
  resourceName: string;
  logoUrl: string | null;
  color: string | null;
  paymentMethod: MonthlyStatementPaymentMethod;
  openingDate: string;
  closingDate: string;
  dueDate: string | null;
  items: MonthlyStatement[];
  total: number;
};

const props = withDefaults(
  defineProps<{
    kind: 'income' | 'expense';
    items: MonthlyStatement[];
    settledTransactions?: SettledTransaction[];
    invoiceSettlements?: InvoiceSettlement[];
  }>(),
  {
    settledTransactions: () => [],
    invoiceSettlements: () => [],
  },
);

const { t } = useI18n();
const { appLocale } = useAppLocale();
const expandedGroupKey = ref<string | null>(null);

const title = computed(() => (props.kind === 'income' ? t('monthlyStatements.incomes') : t('monthlyStatements.expenses')));
const emptyMessage = computed(() => (props.kind === 'income' ? t('monthlyStatements.emptyIncomes') : t('monthlyStatements.emptyExpenses')));
const newButtonName = computed(() => (props.kind === 'income' ? t('monthlyStatements.newIncome') : t('monthlyStatements.newExpense')));
const newButtonRoute = computed(() => ({ name: 'transactionsNew', query: { kind: props.kind } }));
const resourceColumnLabel = computed(() =>
  props.kind === 'income' ? t('monthlyStatements.columns.account') : t('monthlyStatements.columns.resource'),
);
const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0));

function resourceVisual(item: MonthlyStatement): { logoUrl: string | null; color: string | null } {
  const brand = item.resourceBrand;

  if (!brand) {
    return { logoUrl: null, color: null };
  }

  if (item.paymentMethod === 'credit_card') {
    return { logoUrl: networkLogoUrl(brand), color: null };
  }

  const logoUrl = institutionLogoUrl(brand);

  return logoUrl ? { logoUrl, color: null } : { logoUrl: null, color: brand };
}

function groupKey(group: Pick<ResourceGroup, 'paymentMethod' | 'resourceId'>) {
  return `${group.paymentMethod}:${group.resourceId}`;
}

const groups = computed<ResourceGroup[]>(() => {
  const byResource = new Map<string, ResourceGroup>();

  for (const item of props.items) {
    const key = groupKey(item);
    const existing = byResource.get(key);

    if (existing) {
      existing.items.push(item);
      existing.total += item.value;
      continue;
    }

    const visual = resourceVisual(item);

    byResource.set(key, {
      resourceId: item.resourceId,
      resourceName: item.resourceName,
      logoUrl: visual.logoUrl,
      color: visual.color,
      paymentMethod: item.paymentMethod,
      openingDate: item.openingDate,
      closingDate: item.closingDate,
      dueDate: item.dueDate,
      items: [item],
      total: item.value,
    });
  }

  return Array.from(byResource.values())
    .map((group) => ({
      ...group,
      items: [...group.items].sort(
        (left, right) => left.currentRecurrenceOn.localeCompare(right.currentRecurrenceOn) || left.description.localeCompare(right.description),
      ),
    }))
    .sort((left, right) => left.resourceName.localeCompare(right.resourceName));
});

function formatValue(value: number) {
  return formatCurrency(value, appLocale.value);
}

function settledOnFor(item: MonthlyStatement) {
  return settledOnForOccurrence(props.settledTransactions, item);
}

function invoiceSettledOnFor(group: ResourceGroup) {
  return settledOnForInvoice(props.invoiceSettlements, group);
}

function isCreditCardGroup(group: ResourceGroup): boolean {
  return group.paymentMethod === 'credit_card';
}

function toggleGroup(group: ResourceGroup) {
  const key = groupKey(group);
  expandedGroupKey.value = expandedGroupKey.value === key ? null : key;
}
</script>

<template>
  <nav class="items panel">
    <div class="panel-heading">
      <p>{{ title }}</p>
      <ButtonNew :name="newButtonName" :route="newButtonRoute" />
    </div>
    <div class="panel-block">
      <table class="table is-bordered is-striped is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>{{ resourceColumnLabel }}</th>
            <th colspan="2">{{ t('monthlyStatements.columns.value') }}</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="group in groups" :key="groupKey(group)">
            <tr>
              <td>
                <span class="resource">
                  <img v-if="group.logoUrl" class="resource-logo" :src="group.logoUrl" :alt="group.resourceName" />
                  <span v-else-if="group.color" class="resource-color" :title="group.color" :style="{ backgroundColor: group.color }"></span>
                  <span class="resource-info">
                    <span class="resource-name">
                      <span>{{ group.resourceName }}</span>
                      <SettledCheck
                        v-if="isCreditCardGroup(group)"
                        :settled-on="invoiceSettledOnFor(group)"
                        tip-key="monthlyStatements.invoiceSettledOn"
                      />
                    </span>
                    <span v-if="isCreditCardGroup(group) && group.dueDate" class="due-date">
                      {{ t('monthlyStatements.dueDate') }}: {{ formatFrontDate(group.dueDate, appLocale) }}
                    </span>
                  </span>
                </span>
              </td>
              <td>{{ formatValue(group.total) }}</td>
              <td class="expand-header">
                <button
                  type="button"
                  class="expand"
                  :aria-expanded="expandedGroupKey === groupKey(group)"
                  :aria-label="expandedGroupKey === groupKey(group) ? t('monthlyStatements.collapseGroup') : t('monthlyStatements.expandGroup')"
                  @click="toggleGroup(group)"
                >
                  <i class="fas" :class="expandedGroupKey === groupKey(group) ? 'fa-chevron-up' : 'fa-chevron-down'" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
            <tr v-if="expandedGroupKey === groupKey(group)">
              <td colspan="3">
                <table class="table is-bordered is-striped is-hoverable is-fullwidth">
                  <thead>
                    <tr v-if="isCreditCardGroup(group)">
                      <th colspan="3">
                        <span class="cycle-dates-row">
                          <span>{{ t('monthlyStatements.openingDate') }}: {{ formatFrontDate(group.openingDate, appLocale) }}</span>
                          <span>{{ t('monthlyStatements.closingDate') }}: {{ formatFrontDate(group.closingDate, appLocale) }}</span>
                        </span>
                      </th>
                    </tr>
                    <tr>
                      <th>{{ t('monthlyStatements.columns.date') }}</th>
                      <th>{{ t('monthlyStatements.columns.description') }}</th>
                      <th>{{ t('monthlyStatements.columns.value') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in group.items" :key="item.id">
                      <td>
                        <span class="date-cell">
                          {{ formatFrontDate(item.currentRecurrenceOn, appLocale) }}
                          <SettledCheck :settled-on="settledOnFor(item)" />
                        </span>
                      </td>
                      <td>
                        <router-link :to="{ name: 'transactionsEdit', params: { id: item.id } }">
                          {{ item.description }}{{ installmentLabel(item) }}
                        </router-link>
                      </td>
                      <td>{{ formatValue(item.value) }}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
        </tbody>

        <tfoot>
          <tr v-if="!items.length">
            <td colspan="3">{{ emptyMessage }}</td>
          </tr>
          <tr v-else>
            <td>
              <b>{{ t('monthlyStatements.total') }}</b>
            </td>
            <td colspan="2">{{ formatValue(total) }}</td>
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

.panel-heading a {
  flex-grow: 0;
}

@media screen and (max-width: 1023px) {
  .panel-heading a {
    margin-block: calc((1.25em - 2rem) / 2);
  }

  .panel-heading :deep(.button) {
    width: 2rem;
    min-width: 2rem;
    height: 2rem;
    padding-top: 2px;
    font-size: 0.85rem;
    line-height: 1;
  }

  .panel-heading :deep(i) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25em;
    height: 1em;
    margin: 0;
    line-height: 1;
  }
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

.resource {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.resource-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.resource-name {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.due-date {
  font-size: 0.8rem;
  color: #7a7a7a;
}

.cycle-dates-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-weight: normal;
}

.resource-logo {
  display: block;
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
  flex-shrink: 0;
}

.resource-color {
  display: block;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
}

.date-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
