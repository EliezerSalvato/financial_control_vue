<script setup lang="ts">
import { useAppLocale } from '@/composables/useAppLocale';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatFrontDate } from '@/locales/locale';

const props = withDefaults(
  defineProps<{
    settledOn?: string | null;
    tipKey?: string;
  }>(),
  {
    tipKey: 'monthlyStatements.settledOn',
  },
);

const { t } = useI18n();
const { appLocale } = useAppLocale();
const tip = computed(() => (props.settledOn ? t(props.tipKey, { date: formatFrontDate(props.settledOn, appLocale.value) }) : ''));
</script>

<template>
  <span v-if="settledOn" class="icon is-small settled-check" :title="tip" :aria-label="tip">
    <i class="fas fa-check has-text-success" aria-hidden="true"></i>
  </span>
</template>

<style scoped>
.settled-check {
  cursor: help;
}
</style>
