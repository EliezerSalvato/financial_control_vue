<script setup lang="ts">
import type { InvoiceSettlement } from '@/types/credit_card';
import type { MonthlyStatement } from '@/types/monthly_statement';
import type { SettledTransaction } from '@/types/transaction';
import type { LocationQuery } from 'vue-router';
import type { MonthlyStatus, MonthlyStatusKind, MonthlyStatusProcessingUpdate } from '@/types/monthly_status';
import { ApiError } from '@/api/client';
import { listInvoiceSettlements } from '@/api/credit_cards';
import { listMonthlyStatements } from '@/api/monthly_statements';
import { listSettledTransactions } from '@/api/transactions';
import { processSettlements } from '@/api/settlements';
import { useAppLocale } from '@/composables/useAppLocale';
import { useMonthlyStatusChannel } from '@/composables/useMonthlyStatusChannel';
import { useNotificationStore } from '@/stores/notification';
import { uniqueYearMonths } from '@/utils/settledOccurrence';
import { useI18n } from 'vue-i18n';
import { getMonthlyStatus, updateMonthlyStatus } from '@/api/monthly_statuses';
import { appQueryToRoute, routeQueryToApp } from '@/utils/routeQuery';
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { formatCurrency } from '@/utils/money';
import { notifyApiError } from '@/utils/notifyApiError';
import { formatFrontDateTime, getTodayIsoDate, getZonedDateParts } from '@/locales/locale';
import Loading from '@/components/Loading.vue';
import Modal from '@/components/Modal.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import Board from '@/pages/monthly_statements/Board.vue';
import PeriodPicker from '@/pages/monthly_statements/PeriodPicker.vue';
import TransfersPanel from '@/pages/monthly_statements/TransfersPanel.vue';

type MonthlyStatementsRouteQuery = {
  month?: string;
  year?: string;
};

type MonthStatusView = Pick<MonthlyStatus, 'status' | 'processing' | 'lastProcessedAt'>;
type PeriodStatus = MonthlyStatusKind | 'missing';

const ROUTE_NAME = 'monthly_statement';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const { appLocale } = useAppLocale();

function defaultPeriod(): { month: number; year: number } {
  const today = getZonedDateParts(new Date(), appLocale.value);

  return { month: today.month, year: today.year };
}

const initialPeriod = defaultPeriod();
const items = ref<MonthlyStatement[]>([]);
const settledTransactions = ref<SettledTransaction[]>([]);
const invoiceSettlements = ref<InvoiceSettlement[]>([]);
const loading = ref(false);
const month = ref(initialPeriod.month);
const year = ref(initialPeriod.year);
const monthStatus = ref<MonthlyStatusKind>('open');
const processing = ref(false);
const lastProcessedAt = ref<string | null>(null);
const laterMonthClosed = ref(false);
const periodStatusCache = new Map<string, PeriodStatus>();
const channelPeriod = ref<{ month: number; year: number } | null>(null);
const statementsReloadKey = ref(0);
const isCloseMonthModalOpen = ref(false);
let requestId = 0;
let refreshId = 0;
let settlementsId = 0;
const incomes = computed(() => items.value.filter((item) => item.kind === 'income'));
const expenses = computed(() => items.value.filter((item) => item.kind === 'expense'));
const totalIncome = computed(() => incomes.value.reduce((sum, item) => sum + item.value, 0));
const totalExpense = computed(() => expenses.value.reduce((sum, item) => sum + item.value, 0));
const balance = computed(() => totalIncome.value - totalExpense.value);
const balanceClass = computed(() => {
  if (balance.value > 0) return 'has-text-success';

  if (balance.value < 0) return 'has-text-danger';

  return undefined;
});
const isMonthOpen = computed(() => monthStatus.value === 'open');
const isFuturePeriod = computed(() => {
  const current = defaultPeriod();

  return year.value > current.year || (year.value === current.year && month.value > current.month);
});
const canManageMonth = computed(() => isMonthOpen.value && !isFuturePeriod.value && !laterMonthClosed.value);
const monthStatusLabel = computed(() => t(`monthlyStatements.statuses.${monthStatus.value}`));
const monthStatusClass = computed(() => (isMonthOpen.value ? 'has-text-success' : 'has-text-danger'));

const lastProcessedTip = computed(() => {
  if (processing.value) return t('monthlyStatements.processing');

  if (!lastProcessedAt.value) return t('monthlyStatements.neverProcessed');

  return t('monthlyStatements.lastProcessedAt', { date: formatFrontDateTime(lastProcessedAt.value, appLocale.value) });
});

function parseMonth(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : NaN;

  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : undefined;
}

function parseYear(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : NaN;

  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

function queryFromRoute(query: LocationQuery) {
  const parsed = routeQueryToApp<MonthlyStatementsRouteQuery>(query);

  return {
    month: parseMonth(parsed.month),
    year: parseYear(parsed.year),
  };
}

function applyQueryToState() {
  const parsed = queryFromRoute(route.query);

  if (!parsed.month || !parsed.year) {
    return false;
  }

  month.value = parsed.month;
  year.value = parsed.year;

  return true;
}

function periodQuery(period: { month: number; year: number }) {
  return appQueryToRoute({
    month: String(period.month),
    year: String(period.year),
  });
}

function goToPeriod(period: { month: number; year: number }) {
  void router.replace({
    name: ROUTE_NAME,
    query: periodQuery(period),
  });
}

function formatValue(value: number) {
  return formatCurrency(value, appLocale.value);
}

function periodCacheKey(periodMonth: number, periodYear: number) {
  return `${periodYear}-${periodMonth}`;
}

function toPeriodValue(periodMonth: number, periodYear: number) {
  return periodYear * 12 + periodMonth;
}

function previousPeriod(periodMonth: number, periodYear: number) {
  if (periodMonth > 1) {
    return { month: periodMonth - 1, year: periodYear };
  }

  return { month: 12, year: periodYear - 1 };
}

function creditCardPeriodDates(statements: MonthlyStatement[]) {
  return statements
    .filter((item) => item.paymentMethod === 'credit_card')
    .flatMap((item) => [item.currentRecurrenceOn, item.openingDate, item.closingDate]);
}

function isSelectedPeriod(period: { month: number; year: number }, periodMonth: number, periodYear: number) {
  return period.month === periodMonth && period.year === periodYear;
}

async function fetchSettledTransactions(periodMonth: number, periodYear: number, statements: MonthlyStatement[]) {
  const periods = uniqueYearMonths(creditCardPeriodDates(statements), { month: periodMonth, year: periodYear });
  const results = await Promise.all(
    periods.map((period) =>
      listSettledTransactions({
        month: period.month,
        year: period.year,
        type: isSelectedPeriod(period, periodMonth, periodYear) ? undefined : 'credit_card',
      }),
    ),
  );

  return results.flatMap((result) => result.settledTransactions);
}

async function fetchInvoiceSettlements(periodMonth: number, periodYear: number) {
  const result = await listInvoiceSettlements({ month: periodMonth, year: periodYear });

  return result.invoiceSettlements;
}

function rememberPeriodStatus(periodMonth: number, periodYear: number, status: PeriodStatus) {
  periodStatusCache.set(periodCacheKey(periodMonth, periodYear), status);
}

async function periodStatus(periodMonth: number, periodYear: number): Promise<PeriodStatus> {
  const cached = periodStatusCache.get(periodCacheKey(periodMonth, periodYear));

  if (cached !== undefined) return cached;

  try {
    const status = await getMonthlyStatus({ month: periodMonth, year: periodYear });
    rememberPeriodStatus(periodMonth, periodYear, status.status);
    return status.status;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      rememberPeriodStatus(periodMonth, periodYear, 'missing');
      return 'missing';
    }

    throw error;
  }
}

async function hasClosedMonthAfter(periodMonth: number, periodYear: number): Promise<boolean> {
  const current = defaultPeriod();
  const periods: { month: number; year: number }[] = [];
  let cursor = current;

  while (toPeriodValue(cursor.month, cursor.year) > toPeriodValue(periodMonth, periodYear)) {
    periods.push(cursor);
    cursor = previousPeriod(cursor.month, cursor.year);
  }

  const statuses = await Promise.all(periods.map((period) => periodStatus(period.month, period.year)));

  return statuses.includes('closed');
}

async function loadSettlements(periodMonth: number, periodYear: number, statements: MonthlyStatement[]) {
  const currentSettlements = ++settlementsId;

  try {
    const [settled, invoices] = await Promise.all([
      fetchSettledTransactions(periodMonth, periodYear, statements),
      fetchInvoiceSettlements(periodMonth, periodYear),
    ]);

    if (currentSettlements !== settlementsId) return;

    if (month.value !== periodMonth || year.value !== periodYear) return;

    settledTransactions.value = settled;
    invoiceSettlements.value = invoices;
  } catch (error) {
    if (currentSettlements !== settlementsId) return;

    notifyApiError(error);
  }
}

function applyMonthlyStatus(status: MonthStatusView, exists = true) {
  monthStatus.value = status.status;
  processing.value = status.processing;
  lastProcessedAt.value = status.lastProcessedAt;
  rememberPeriodStatus(month.value, year.value, exists ? status.status : 'missing');
  channelPeriod.value = exists ? { month: month.value, year: year.value } : null;
}

async function refreshStatements() {
  const currentRefresh = ++refreshId;
  const periodMonth = month.value;
  const periodYear = year.value;

  try {
    const result = await listMonthlyStatements({ month: periodMonth, year: periodYear });

    if (currentRefresh !== refreshId) return;

    if (month.value !== periodMonth || year.value !== periodYear) return;

    items.value = result.monthlyStatements;
    statementsReloadKey.value += 1;
    void loadSettlements(periodMonth, periodYear, result.monthlyStatements);
  } catch (error) {
    if (currentRefresh !== refreshId) return;

    notifyApiError(error);
  }
}

function reloadAfterProcessing() {
  void loadSettlements(month.value, year.value, items.value);
  void refreshStatements();
}

function applyProcessingUpdate(update: MonthlyStatusProcessingUpdate) {
  const wasProcessing = processing.value;

  processing.value = update.processing;
  lastProcessedAt.value = update.lastProcessedAt;

  if (wasProcessing && !update.processing) {
    reloadAfterProcessing();
  }
}

useMonthlyStatusChannel(channelPeriod, applyProcessingUpdate);

async function fetchMonthStatus(): Promise<{ status: MonthStatusView; exists: boolean }> {
  try {
    return { status: await getMonthlyStatus({ month: month.value, year: year.value }), exists: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { status: { status: 'open', processing: false, lastProcessedAt: null }, exists: false };
    }

    throw error;
  }
}

async function getData() {
  const currentRequest = ++requestId;
  refreshId += 1;
  settlementsId += 1;
  loading.value = true;
  channelPeriod.value = null;

  try {
    const periodMonth = month.value;
    const periodYear = year.value;
    const [result, monthStatusResult, closedAfter] = await Promise.all([
      listMonthlyStatements({ month: periodMonth, year: periodYear }),
      fetchMonthStatus(),
      hasClosedMonthAfter(periodMonth, periodYear),
    ]);

    if (currentRequest !== requestId) return;

    items.value = result.monthlyStatements;
    settledTransactions.value = [];
    invoiceSettlements.value = [];
    laterMonthClosed.value = closedAfter;
    applyMonthlyStatus(monthStatusResult.status, monthStatusResult.exists);
    void loadSettlements(periodMonth, periodYear, result.monthlyStatements);
  } catch (error) {
    if (currentRequest !== requestId) return;

    items.value = [];
    settledTransactions.value = [];
    invoiceSettlements.value = [];
    notifyApiError(error);
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function openCloseMonthModal() {
  if (!canManageMonth.value) return;

  isCloseMonthModalOpen.value = true;
}

function closeCloseMonthModal() {
  isCloseMonthModalOpen.value = false;
}

async function confirmCloseMonth() {
  closeCloseMonthModal();
  loading.value = true;

  try {
    const result = await updateMonthlyStatus({
      monthlyStatus: {
        month: month.value,
        year: year.value,
        status: 'closed',
      },
    });

    applyMonthlyStatus(result.monthlyStatus, true);
    laterMonthClosed.value = false;
    notificationStore.setCurrentMessage(result.message, 'success');
  } catch (error) {
    notifyApiError(error);
  } finally {
    loading.value = false;
  }
}

function referenceDateForPeriod(periodMonth: number, periodYear: number): string | null {
  const today = getZonedDateParts(new Date(), appLocale.value);

  if (periodMonth !== today.month || periodYear !== today.year) {
    return null;
  }

  return getTodayIsoDate(appLocale.value);
}

async function processMonth() {
  if (!canManageMonth.value || processing.value) return;

  processing.value = true;

  try {
    const result = await processSettlements({
      settlement: {
        month: month.value,
        year: year.value,
        referenceDate: referenceDateForPeriod(month.value, year.value),
      },
    });

    notificationStore.setCurrentMessage(result.message, 'success');

    if (!channelPeriod.value) {
      const monthStatusResult = await fetchMonthStatus();
      applyMonthlyStatus(monthStatusResult.status, monthStatusResult.exists);

      if (!processing.value) {
        reloadAfterProcessing();
      }
    }
  } catch (error) {
    processing.value = false;
    notifyApiError(error);
  }
}

watch(
  () => route.query,
  async () => {
    if (!applyQueryToState()) {
      await router.replace({ name: ROUTE_NAME, query: periodQuery(defaultPeriod()) });
      return;
    }

    void getData();
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div>
    <Loading v-show="loading" />

    <div v-show="!loading" class="monthly-statement">
      <NotificationMessage class="notification-message" />

      <PeriodPicker :month="month" :year="year" @select="goToPeriod" />

      <div class="box month-status">
        <div class="month-status-info">
          <b>{{ t('monthlyStatements.monthStatus') }}:</b>
          <span class="has-text-weight-bold" :class="monthStatusClass">{{ monthStatusLabel }}</span>
          <button v-if="canManageMonth" type="button" class="button is-small" @click="openCloseMonthModal">
            {{ t('monthlyStatements.closeMonth') }}
          </button>
        </div>
        <div v-if="canManageMonth" class="process-month">
          <span class="icon is-small process-month-tip" :title="lastProcessedTip" :aria-label="lastProcessedTip">
            <i class="fas fa-info-circle" aria-hidden="true"></i>
          </span>
          <button type="button" class="button is-small" :class="{ 'is-loading': processing }" :disabled="processing" @click="processMonth">
            {{ t('monthlyStatements.processMonth') }}
          </button>
        </div>
      </div>

      <Board
        class="incomes-board"
        kind="income"
        :items="incomes"
        :settled-transactions="settledTransactions"
        :invoice-settlements="invoiceSettlements"
      />
      <Board
        class="expenses-board"
        kind="expense"
        :items="expenses"
        :settled-transactions="settledTransactions"
        :invoice-settlements="invoiceSettlements"
      />

      <div class="box balance">
        <b>{{ t('monthlyStatements.balance') }}:</b>
        <span :class="balanceClass">{{ formatValue(balance) }}</span>
      </div>

      <TransfersPanel
        class="transfers-panel"
        :month="month"
        :year="year"
        :reload-key="statementsReloadKey"
        :settled-transactions="settledTransactions"
      />
    </div>

    <Modal :title="t('modalDelete.title')" :open-modal="isCloseMonthModalOpen" @close="closeCloseMonthModal">
      <template #body>
        {{ t('monthlyStatements.closeMonthConfirm') }}
      </template>
      <template #footer>
        <button class="button is-success" @click="confirmCloseMonth">{{ t('buttons.yes') }}</button>
        <button class="button" @click="closeCloseMonthModal">{{ t('buttons.no') }}</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.monthly-statement {
  margin: 0 auto;
  max-width: 1344px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto 1fr auto auto;
  grid-template-areas:
    'notification notification'
    'date date'
    'month-status month-status'
    'incomes expenses'
    'balance balance'
    'transfers transfers';
  align-content: start;
  column-gap: 10px;
}

@media (max-width: 1023px) {
  .monthly-statement {
    margin: 0 10px;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
      'notification'
      'date'
      'month-status'
      'balance'
      'expenses'
      'incomes'
      'transfers';
  }
}

.notification-message {
  grid-area: notification;
}

.month-status {
  grid-area: month-status;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 10px;
  margin-bottom: 12px;
  text-align: center;
  padding: 5px 10px;
}

.month-status-info {
  grid-column: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.process-month {
  grid-column: 3;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
}

.process-month-tip {
  cursor: help;
}

.incomes-board {
  grid-area: incomes;
}

.expenses-board {
  grid-area: expenses;
}

.balance {
  grid-area: balance;
  margin-bottom: 1.5rem;
  text-align: center;
  padding: 5px;
}

.transfers-panel {
  grid-area: transfers;
  margin-bottom: 10px;
}

.balance b {
  margin-right: 10px;
}

@media (max-width: 1023px) {
  .month-status {
    grid-template-columns: 1fr auto;
    margin-top: 12px;
    margin-bottom: 0;
  }

  .month-status-info {
    grid-column: 1;
  }

  .process-month {
    grid-column: 2;
  }

  .balance {
    margin-top: 12px;
    margin-bottom: 12px;
  }

  .incomes-board,
  .transfers-panel {
    margin-top: -12px;
  }
}
</style>
