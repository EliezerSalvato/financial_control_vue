<script setup lang="ts">
import type { SettledTransaction } from '@/types/transaction';
import type { MonthlyStatementTransfer } from '@/types/monthly_statement';
import { listMonthlyStatementTransfers } from '@/api/monthly_statements';
import { useAppLocale } from '@/composables/useAppLocale';
import { installmentLabel } from '@/utils/installmentLabel';
import { institutionLogoUrl } from '@/utils/institutionLogos';
import { settledOnForOccurrence } from '@/utils/settledOccurrence';
import { useI18n } from 'vue-i18n';
import { computed, ref, watch } from 'vue';
import { formatCurrency } from '@/utils/money';
import { notifyApiError } from '@/utils/notifyApiError';
import { formatFrontDate } from '@/locales/locale';
import ButtonNew from '@/components/inputs/ButtonNew.vue';
import Loading from '@/components/Loading.vue';
import SettledCheck from '@/pages/monthly_statements/SettledCheck.vue';

const props = withDefaults(
  defineProps<{
    month: number;
    year: number;
    reloadKey?: number;
    settledTransactions?: SettledTransaction[];
  }>(),
  {
    settledTransactions: () => [],
  },
);

const { t } = useI18n();

const expanded = ref(false);
const loading = ref(false);
const items = ref<MonthlyStatementTransfer[]>([]);
const loadedPeriod = ref<{ month: number; year: number } | null>(null);
let requestId = 0;

const { appLocale } = useAppLocale();
const toggleLabel = computed(() => (expanded.value ? t('monthlyStatements.collapseTransfers') : t('monthlyStatements.expandTransfers')));
const newButtonRoute = computed(() => ({ name: 'transactionsNew', query: { kind: 'transfer_between_accounts' } }));

function accountVisual(brand: string | null): { logoUrl: string | null; color: string | null } {
  if (!brand) {
    return { logoUrl: null, color: null };
  }

  const logoUrl = institutionLogoUrl(brand);

  return logoUrl ? { logoUrl, color: null } : { logoUrl: null, color: brand };
}

const rows = computed(() =>
  [...items.value]
    .sort((left, right) => left.currentRecurrenceOn.localeCompare(right.currentRecurrenceOn) || left.description.localeCompare(right.description))
    .map((item) => ({
      ...item,
      sourceVisual: accountVisual(item.sourceAccountBrand),
      destinationVisual: accountVisual(item.destinationAccountBrand),
    })),
);

function isLoadedForCurrentPeriod() {
  return loadedPeriod.value?.month === props.month && loadedPeriod.value?.year === props.year;
}

function formatValue(value: number) {
  return formatCurrency(value, appLocale.value);
}

function settledOnFor(item: MonthlyStatementTransfer) {
  return settledOnForOccurrence(props.settledTransactions, item);
}

async function getData() {
  const currentRequest = ++requestId;
  loading.value = true;

  try {
    const result = await listMonthlyStatementTransfers({ month: props.month, year: props.year });

    if (currentRequest !== requestId) return;

    items.value = result.monthlyStatementTransfers;
    loadedPeriod.value = { month: props.month, year: props.year };
  } catch (error) {
    if (currentRequest !== requestId) return;

    items.value = [];
    loadedPeriod.value = null;
    notifyApiError(error);
  } finally {
    if (currentRequest === requestId) {
      loading.value = false;
    }
  }
}

function toggleExpanded() {
  expanded.value = !expanded.value;

  if (expanded.value && !isLoadedForCurrentPeriod()) {
    void getData();
  }
}

watch(
  () => [props.month, props.year] as const,
  () => {
    if (expanded.value) {
      void getData();
      return;
    }

    items.value = [];
    loadedPeriod.value = null;
  },
);

watch(
  () => props.reloadKey,
  () => {
    if (expanded.value) {
      void getData();
    }
  },
);
</script>

<template>
  <nav class="items panel">
    <div class="panel-heading">
      <p>{{ t('monthlyStatements.transfers') }}</p>
      <ButtonNew :name="t('monthlyStatements.newTransfer')" :route="newButtonRoute" />
      <button type="button" class="expand" :aria-expanded="expanded" :aria-label="toggleLabel" @click="toggleExpanded">
        <i class="fas" :class="expanded ? 'fa-chevron-up' : 'fa-chevron-down'" aria-hidden="true"></i>
      </button>
    </div>
    <div v-if="expanded" class="panel-block">
      <Loading v-show="loading" />

      <table v-show="!loading" class="table is-bordered is-striped is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>{{ t('monthlyStatements.columns.date') }}</th>
            <th>{{ t('monthlyStatements.columns.description') }}</th>
            <th class="is-hidden-touch">{{ t('monthlyStatements.columns.sourceAccount') }}</th>
            <th class="is-hidden-touch">{{ t('monthlyStatements.columns.destinationAccount') }}</th>
            <th>{{ t('monthlyStatements.columns.value') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in rows" :key="item.id">
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
            <td class="is-hidden-touch">
              <span class="account">
                <img v-if="item.sourceVisual.logoUrl" class="account-logo" :src="item.sourceVisual.logoUrl" :alt="item.sourceAccountName" />
                <span
                  v-else-if="item.sourceVisual.color"
                  class="account-color"
                  :title="item.sourceVisual.color"
                  :style="{ backgroundColor: item.sourceVisual.color }"
                ></span>
                <span>{{ item.sourceAccountName }}</span>
              </span>
            </td>
            <td class="is-hidden-touch">
              <span class="account">
                <img
                  v-if="item.destinationVisual.logoUrl"
                  class="account-logo"
                  :src="item.destinationVisual.logoUrl"
                  :alt="item.destinationAccountName"
                />
                <span
                  v-else-if="item.destinationVisual.color"
                  class="account-color"
                  :title="item.destinationVisual.color"
                  :style="{ backgroundColor: item.destinationVisual.color }"
                ></span>
                <span>{{ item.destinationAccountName }}</span>
              </span>
            </td>
            <td>{{ formatValue(item.value) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr v-if="!items.length">
            <td class="is-hidden-touch" colspan="5">{{ t('monthlyStatements.emptyTransfers') }}</td>
            <td class="is-hidden-desktop" colspan="3">{{ t('monthlyStatements.emptyTransfers') }}</td>
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
  overflow-x: auto;
}

.panel-heading {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
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

.expand {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #3273dc;
  color: white;
  width: 20px;
  height: 20px;
  margin: 0;
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

.account {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.account-logo {
  display: block;
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
  flex-shrink: 0;
}

.account-color {
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
