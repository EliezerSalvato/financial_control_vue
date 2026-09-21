<script setup lang="ts">
import type { TagGoal } from '@/types/tag';
import { useAppLocale } from '@/composables/useAppLocale';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { formatMonthYear } from '@/utils/isoDate';
import { formatCurrency } from '@/utils/money';
import { tagGoalStartsOn } from '@/utils/tagGoal';
import Modal from '@/components/Modal.vue';

type GoalItem = Pick<TagGoal, 'id' | 'month' | 'year' | 'value'>;

const props = withDefaults(
  defineProps<{
    goals: GoalItem[];
    open?: boolean;
    i18nNamespace?: 'tags' | 'categories';
  }>(),
  {
    open: false,
    i18nNamespace: 'tags',
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { t } = useI18n();
const { appLocale } = useAppLocale();

const items = computed(() => [...props.goals].sort((left, right) => tagGoalStartsOn(left).localeCompare(tagGoalStartsOn(right))));

function close() {
  emit('update:open', false);
}

function formatValue(value: number) {
  return formatCurrency(value, appLocale.value);
}
</script>

<template>
  <Modal :title="t(`${i18nNamespace}.goalHistory.title`)" :open-modal="open" @close="close">
    <template #body>
      <table class="table is-bordered is-striped is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>{{ t(`${i18nNamespace}.goalHistory.month`) }}</th>
            <th class="value">{{ t(`${i18nNamespace}.goalHistory.value`) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ formatMonthYear(item.year, item.month) }}</td>
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
