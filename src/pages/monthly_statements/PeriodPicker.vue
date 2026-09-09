<script setup lang="ts">
import type { AppLocale } from '@/locales/locale';
import { useAppLocale } from '@/composables/useAppLocale';
import { useI18n } from 'vue-i18n';
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue';

const YEARS_COUNT = 12;
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const props = defineProps<{
  month: number;
  year: number;
}>();

const emit = defineEmits<{
  select: [period: { month: number; year: number }];
}>();

const { t } = useI18n();
const root = useTemplateRef<HTMLElement>('root');
const isOpen = ref(false);
const step = ref<'year' | 'month'>('year');
const yearPageStart = ref(pageStartFor(props.year));
const pickedYear = ref(props.year);

const { appLocale } = useAppLocale();
const periodLabel = computed(() => `${String(props.month).padStart(2, '0')}/${props.year}`);
const years = computed(() => Array.from({ length: YEARS_COUNT }, (_, index) => yearPageStart.value + index));
const yearRangeLabel = computed(() => `${years.value[0]} – ${years.value[years.value.length - 1]}`);
const canGoToPreviousYears = computed(() => yearPageStart.value > 1);
const monthLabels = computed(() => MONTHS.map((month) => formatMonthLabel(month, appLocale.value)));

function pageStartFor(year: number) {
  return Math.max(1, Math.floor((Math.max(year, 1) - 1) / YEARS_COUNT) * YEARS_COUNT + 1);
}

function formatMonthLabel(month: number, locale: AppLocale) {
  const label = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, month - 1, 1)));
  const trimmed = label.replace(/\.$/, '');

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function close() {
  isOpen.value = false;
  step.value = 'year';
}

function toggle() {
  if (isOpen.value) {
    close();
    return;
  }

  yearPageStart.value = pageStartFor(props.year);
  pickedYear.value = props.year;
  step.value = 'year';
  isOpen.value = true;
}

function shiftPeriod(offset: number) {
  const totalMonths = props.year * 12 + (props.month - 1) + offset;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;

  close();
  emit('select', { month: nextMonth, year: nextYear });
}

function shiftYearPage(offset: number) {
  yearPageStart.value = pageStartFor(yearPageStart.value + offset * YEARS_COUNT);
}

function selectYear(year: number) {
  pickedYear.value = year;
  step.value = 'month';
}

function selectMonth(month: number) {
  emit('select', { month, year: pickedYear.value });
  close();
}

function backToYears() {
  step.value = 'year';
  yearPageStart.value = pageStartFor(pickedYear.value);
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) {
    close();
  }
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close();
  }
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('pointerdown', onDocumentPointerDown);
    document.addEventListener('keydown', onDocumentKeydown);
    return;
  }

  document.removeEventListener('pointerdown', onDocumentPointerDown);
  document.removeEventListener('keydown', onDocumentKeydown);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  document.removeEventListener('keydown', onDocumentKeydown);
});
</script>

<template>
  <div ref="root" class="date-chosen">
    <div class="buttons has-addons date-chosen-nav">
      <button type="button" class="button" @click="shiftPeriod(-1)">{{ t('paginator.prev') }}</button>
      <button
        type="button"
        class="button period-trigger"
        :class="{ 'is-primary': isOpen }"
        :aria-expanded="isOpen"
        aria-haspopup="dialog"
        :aria-label="t('monthlyStatements.periodPicker.currentPeriod')"
        @click="toggle"
      >
        <span>{{ periodLabel }}</span>
        <span class="icon is-small" aria-hidden="true">
          <i class="fas" :class="isOpen ? 'fa-caret-up' : 'fa-caret-down'"></i>
        </span>
      </button>
      <button type="button" class="button" @click="shiftPeriod(1)">{{ t('paginator.next') }}</button>
    </div>

    <div
      v-if="isOpen"
      class="period-picker"
      role="dialog"
      :aria-label="t(`monthlyStatements.periodPicker.${step === 'year' ? 'selectYear' : 'selectMonth'}`)"
    >
      <div class="period-picker-header">
        <button
          v-if="step === 'year'"
          type="button"
          class="button is-small period-picker-nav"
          :disabled="!canGoToPreviousYears"
          :aria-label="t('monthlyStatements.periodPicker.previousYears')"
          @click="shiftYearPage(-1)"
        >
          <span class="icon is-small" aria-hidden="true">
            <i class="fas fa-chevron-left"></i>
          </span>
        </button>
        <button
          v-else
          type="button"
          class="button is-small period-picker-nav"
          :aria-label="t('monthlyStatements.periodPicker.backToYears')"
          @click="backToYears"
        >
          <span class="icon is-small" aria-hidden="true">
            <i class="fas fa-chevron-left"></i>
          </span>
        </button>

        <button v-if="step === 'month'" type="button" class="period-picker-title" @click="backToYears">
          {{ pickedYear }}
        </button>
        <span v-else class="period-picker-title">{{ yearRangeLabel }}</span>

        <button
          v-if="step === 'year'"
          type="button"
          class="button is-small period-picker-nav"
          :aria-label="t('monthlyStatements.periodPicker.nextYears')"
          @click="shiftYearPage(1)"
        >
          <span class="icon is-small" aria-hidden="true">
            <i class="fas fa-chevron-right"></i>
          </span>
        </button>
        <span v-else class="period-picker-nav-spacer"></span>
      </div>

      <div v-if="step === 'year'" class="period-picker-grid">
        <button
          v-for="itemYear in years"
          :key="itemYear"
          type="button"
          class="button is-small"
          :class="{ 'is-primary': itemYear === pickedYear }"
          @click="selectYear(itemYear)"
        >
          {{ itemYear }}
        </button>
      </div>

      <div v-else class="period-picker-grid">
        <button
          v-for="itemMonth in MONTHS"
          :key="itemMonth"
          type="button"
          class="button is-small"
          :class="{ 'is-primary': itemMonth === month && pickedYear === year }"
          @click="selectMonth(itemMonth)"
        >
          {{ monthLabels[itemMonth - 1] }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-chosen {
  grid-area: date;
  justify-self: center;
  position: relative;
  margin: 0 0 12px;
}

.date-chosen-nav {
  margin-bottom: 0 !important;
}

.date-chosen-nav .button {
  margin-bottom: 0;
}

.period-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 7.5rem;
  gap: 0.35rem;
}

.period-picker {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  z-index: 20;
  width: 18rem;
  padding: 0.75rem;
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1);
  transform: translateX(-50%);
}

.period-picker-header {
  display: grid;
  grid-template-columns: 2rem 1fr 2rem;
  align-items: center;
  margin-bottom: 0.75rem;
  column-gap: 0.5rem;
}

.period-picker-title {
  justify-self: center;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #363636;
  font-weight: 600;
  line-height: 1.5;
}

button.period-picker-title {
  cursor: pointer;
}

button.period-picker-title:hover {
  color: #00d1b2;
}

.period-picker-nav {
  width: 2rem;
  height: 2rem;
  padding: 0;
}

.period-picker-nav-spacer {
  width: 2rem;
  height: 2rem;
}

.period-picker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
}

.period-picker-grid .button {
  margin: 0;
}

@media (max-width: 1023px) {
  .date-chosen {
    margin: 0;
  }
}
</style>
