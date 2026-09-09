<script setup lang="ts">
import type { TransactionRecurrence } from '@/types/transaction';
import { useAppLocale } from '@/composables/useAppLocale';
import { formatCurrency } from '@/utils/money';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import Modal from '@/components/Modal.vue';

const props = withDefaults(
  defineProps<{
    recurrences: TransactionRecurrence[];
    open?: boolean;
  }>(),
  {
    open: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useI18n();
const { appLocale, formatDateLocal } = useAppLocale();

const items = computed(() => [...props.recurrences].sort((a, b) => a.startsOn.localeCompare(b.startsOn)));

function close() {
  emit('update:open', false);
}

function formatValue(value: number) {
  return formatCurrency(value, appLocale.value);
}
</script>

<template>
  <Modal :title="t('transactions.recurrenceHistory.title')" :open-modal="open" @close="close">
    <template #body>
      <table class="table is-bordered is-striped is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>{{ t('transactions.form.startsOn') }}</th>
            <th class="value">{{ t('transactions.columns.value') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ formatDateLocal(item.startsOn) }}</td>
            <td class="value">{{ formatValue(item.value) }}</td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="2">{{ t('noResultsFound') }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <template #footer>
      <button type="button" class="button" @click="close">{{ t('buttons.back') }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.table {
  margin-bottom: 0;
}

.value {
  text-align: right;
  white-space: nowrap;
}
</style>
