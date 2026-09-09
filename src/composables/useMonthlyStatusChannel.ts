import type { MaybeRefOrGetter } from 'vue';
import type { MonthlyStatusProcessingUpdate, MonthlyStatusShowParams } from '@/types/monthly_status';
import { subscribeMonthlyStatusProcessing } from '@/api/monthly_statuses';
import { onUnmounted, toValue, watch } from 'vue';

export function useMonthlyStatusChannel(
  period: MaybeRefOrGetter<MonthlyStatusShowParams | null>,
  onUpdate: (update: MonthlyStatusProcessingUpdate) => void,
) {
  let unsubscribe: (() => void) | null = null;

  function disconnect() {
    unsubscribe?.();
    unsubscribe = null;
  }

  watch(
    () => {
      const value = toValue(period);

      if (!value) return null;

      return `${value.year}-${value.month}`;
    },
    () => {
      disconnect();

      const value = toValue(period);

      if (!value) return;

      unsubscribe = subscribeMonthlyStatusProcessing(value, onUpdate);
    },
    { immediate: true },
  );

  onUnmounted(disconnect);
}
