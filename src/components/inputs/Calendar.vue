<script setup lang="ts">
import { useAppLocale } from '@/composables/useAppLocale';
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { getCalendarLang, getFrontDateFormat, getTodayIsoDate } from '@/locales/locale';

const { t } = useI18n();
const model = defineModel<string | null>();

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    withDefaultDate?: boolean;
  }>(),
  {
    required: false,
    disabled: false,
    withDefaultDate: false,
  },
);

const emit = defineEmits<{
  'change:value': [payload: { name?: string; value: string | null }];
}>();

const input = useTemplateRef<HTMLInputElement>('input');
const draft = ref('');

const { appLocale } = useAppLocale();
const dateFormat = computed(() => getFrontDateFormat(appLocale.value));
const calendarLang = computed(() => getCalendarLang(appLocale.value));

function isoToDisplay(iso: string | null | undefined, format: string): string {
  if (!iso) return '';

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const year = match?.[1];
  const month = match?.[2];
  const day = match?.[3];

  if (!year || !month || !day) return '';

  return format.replace('YYYY', year).replace('MM', month).replace('DD', day);
}

function maskDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;

  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function displayToIso(value: string, format: string): string | null {
  const digits = value.replace(/\D/g, '');

  if (digits.length !== 8) return null;

  const first = digits.slice(0, 2);
  const second = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  const day = format.startsWith('DD') ? first : second;
  const month = format.startsWith('DD') ? second : first;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);

  if (!isValidDate(yearNumber, monthNumber, dayNumber)) return null;

  return `${year}-${month}-${day}`;
}

function setModel(value: string | null) {
  if (model.value === value) return;

  model.value = value;
  emit('change:value', { name: props.name, value });
}

function updateFromText(event: Event) {
  if (props.disabled) return;

  const target = event.target as HTMLInputElement;
  const masked = maskDate(target.value);

  target.value = masked;
  draft.value = masked;

  if (masked === '') {
    setModel(null);
    return;
  }

  const iso = displayToIso(masked, dateFormat.value);

  if (iso) setModel(iso);
}

function updateFromPicker(event: Event) {
  if (props.disabled) return;

  const value = (event.target as HTMLInputElement).value || null;

  setModel(value);
}

function syncDraftFromModel() {
  draft.value = isoToDisplay(model.value, dateFormat.value);
}

function focus() {
  input.value?.focus();
}

defineExpose({ focus });

watch([() => model.value, dateFormat], syncDraftFromModel, { immediate: true });

onMounted(() => {
  if (!model.value && props.withDefaultDate) {
    setModel(getTodayIsoDate(appLocale.value));
  }
});
</script>

<template>
  <div>
    <label v-if="label" class="label" :for="name" @click="focus">
      {{ label }}
      <abbr v-if="label && required" :title="t('required')">*</abbr>
    </label>
    <div class="calendar-control control has-icons-right" :class="{ 'is-disabled': disabled }">
      <input
        type="text"
        ref="input"
        class="input"
        inputmode="numeric"
        autocomplete="off"
        maxlength="10"
        :name="name"
        :lang="appLocale"
        :value="draft"
        :placeholder="placeholder ?? dateFormat"
        :disabled="disabled"
        :class="{ 'is-danger': error, 'is-primary': !error }"
        @input="updateFromText"
        @blur="syncDraftFromModel"
      />
      <span class="icon is-small is-right">
        <i class="fas fa-calendar"></i>
      </span>
      <input
        :key="calendarLang"
        type="date"
        class="calendar-native"
        :lang="calendarLang"
        :value="model ?? ''"
        :disabled="disabled"
        tabindex="-1"
        @input="updateFromPicker"
      />
    </div>
    <p class="help is-danger">{{ error }}</p>
  </div>
</template>

<style scoped>
.calendar-control {
  position: relative;
}

.calendar-native {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  width: 2.5rem;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  opacity: 0;
  cursor: pointer;
}

.calendar-native::-webkit-calendar-picker-indicator {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  cursor: pointer;
}

.calendar-native[disabled] {
  cursor: not-allowed;
}

.calendar-control.is-disabled {
  cursor: not-allowed;
}

.calendar-control.is-disabled .input[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: whitesmoke;
  color: #7a7a7a;
  -webkit-text-fill-color: #7a7a7a;
  box-shadow: none;
}

.calendar-control.is-disabled .input[disabled].is-primary {
  border-color: #00d1b2;
}

.calendar-control.is-disabled .input[disabled].is-danger {
  border-color: #ff3860;
}

.calendar-control.is-disabled .icon {
  opacity: 0.6;
}
</style>
