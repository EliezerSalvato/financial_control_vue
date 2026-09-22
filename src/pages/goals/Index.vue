<script setup lang="ts">
import type { GoalTarget, GoalTransaction } from '@/types/goal';
import type { MonthlyStatusKind } from '@/types/monthly_status';
import type { LocationQuery } from 'vue-router';
import { ApiError } from '@/api/client';
import { listGoals, listGoalTargets } from '@/api/goals';
import { useAppLocale } from '@/composables/useAppLocale';
import { useI18n } from 'vue-i18n';
import { getMonthlyStatus } from '@/api/monthly_statuses';
import { getZonedDateParts } from '@/locales/locale';
import { appQueryToRoute, routeQueryToApp } from '@/utils/routeQuery';
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { notifyApiError } from '@/utils/notifyApiError';
import Loading from '@/components/Loading.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import Board from '@/pages/goals/Board.vue';
import PeriodPicker from '@/pages/monthly_statements/PeriodPicker.vue';

type GoalsRouteQuery = {
  month?: string;
  year?: string;
};

const ROUTE_NAME = 'goals';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { appLocale } = useAppLocale();

function defaultPeriod(): { month: number; year: number } {
  const today = getZonedDateParts(new Date(), appLocale.value);

  return { month: today.month, year: today.year };
}

const initialPeriod = defaultPeriod();
const transactions = ref<GoalTransaction[]>([]);
const targets = ref<GoalTarget[]>([]);
const loading = ref(false);
const month = ref(initialPeriod.month);
const year = ref(initialPeriod.year);
const monthStatus = ref<MonthlyStatusKind>('open');
let requestId = 0;

const monthStatusLabel = computed(() => t(`monthlyStatements.statuses.${monthStatus.value}`));
const monthStatusClass = computed(() => (monthStatus.value === 'open' ? 'has-text-success' : 'has-text-danger'));

function parseMonth(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : NaN;

  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : undefined;
}

function parseYear(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : NaN;

  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

function queryFromRoute(query: LocationQuery) {
  const parsed = routeQueryToApp<GoalsRouteQuery>(query);

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

async function fetchMonthStatus(): Promise<MonthlyStatusKind> {
  try {
    const status = await getMonthlyStatus({ month: month.value, year: year.value });
    return status.status;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return 'open';
    }

    throw error;
  }
}

async function getData() {
  const currentRequest = ++requestId;
  loading.value = true;

  try {
    const periodMonth = month.value;
    const periodYear = year.value;
    const [goalsResult, targetsResult, status] = await Promise.all([
      listGoals({ month: periodMonth, year: periodYear }),
      listGoalTargets({ month: periodMonth, year: periodYear }),
      fetchMonthStatus(),
    ]);

    if (currentRequest !== requestId) return;

    transactions.value = goalsResult.goalTransactions;
    targets.value = targetsResult.goalTargets;
    monthStatus.value = status;
  } catch (error) {
    if (currentRequest !== requestId) return;

    transactions.value = [];
    targets.value = [];
    monthStatus.value = 'open';
    notifyApiError(error);
  } finally {
    if (currentRequest === requestId) loading.value = false;
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

    <div v-show="!loading" class="goals">
      <NotificationMessage class="notification-message" />

      <div class="period-picker-wrap">
        <PeriodPicker :month="month" :year="year" @select="goToPeriod" />
      </div>

      <div class="box month-status">
        <div class="month-status-info">
          <b>{{ t('monthlyStatements.monthStatus') }}:</b>
          <span class="has-text-weight-bold" :class="monthStatusClass">{{ monthStatusLabel }}</span>
        </div>
      </div>

      <Board kind="category" :targets="targets" :transactions="transactions" />
      <Board kind="tag" :targets="targets" :transactions="transactions" />
    </div>
  </div>
</template>

<style scoped>
.goals {
  margin: 10px auto;
  max-width: 800px;
  display: flex;
  flex-direction: column;
}

.notification-message {
  margin-bottom: 12px;
}

.period-picker-wrap {
  display: flex;
  justify-content: center;
}

.month-status {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
  text-align: center;
  padding: 5px 10px;
}

.month-status-info {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
