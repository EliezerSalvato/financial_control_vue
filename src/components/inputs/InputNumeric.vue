<script setup lang="ts">
import { useAppLocale } from '@/composables/useAppLocale';
import { useI18n } from 'vue-i18n';
import { computed, useTemplateRef } from 'vue';
import { getCurrencySymbol } from '@/locales/locale';

const { t } = useI18n();

const model = defineModel<number | null>();

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    error?: string;
    placeholder?: string;
    required?: boolean;
    maxLength?: number;
    disabled?: boolean;
  }>(),
  {
    required: false,
    maxLength: 14,
    disabled: false,
  },
);

const emit = defineEmits<{
  'change:value': [payload: { name?: string; value: number | null }];
}>();

const input = useTemplateRef<HTMLInputElement>('input');

const { appLocale } = useAppLocale();

const currencySymbol = computed(() => getCurrencySymbol(appLocale.value));

const formattedValue = computed(() =>
  model.value == null
    ? null
    : new Intl.NumberFormat(appLocale.value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(model.value),
);

function isNumber(event: Event, value: string) {
  if (event instanceof InputEvent && !event.inputType.includes('delete')) {
    if (isNaN(Number(value))) {
      return false;
    }
  }

  if (['.', ','].includes(event instanceof InputEvent ? (event.data ?? '') : '')) {
    return false;
  }

  return true;
}

function numericValue(value: string) {
  value = value.replace(/[^\d]/g, '').padStart(3, '0');

  return Number(`${value.slice(0, value.length - 2)}.${value.slice(value.length - 2)}`);
}

function updateValue(event: Event) {
  if (props.disabled) return;

  const target = event.target as HTMLInputElement;
  let value: string | number | null = target.value.replace(/[.,]/g, '');

  if (!isNumber(event, value)) {
    target.value = formattedValue.value ?? '';
    return;
  }

  value = value !== '' ? numericValue(value) : null;

  model.value = value;
  emit('change:value', { name: props.name, value });
}

function focus() {
  input.value?.focus();
}
</script>

<template>
  <div>
    <label v-if="label" class="label" :class="{ 'has-extra': $slots['label-extra'] }" :for="name">
      <span @click="focus">
        {{ label }}
        <abbr v-if="required" :title="t('required')">*</abbr>
      </span>
      <span v-if="$slots['label-extra']" class="label-extra" @click.stop>
        <slot name="label-extra" />
      </span>
    </label>
    <div class="numeric-row">
      <div class="numeric-control" :class="{ 'is-danger': error, 'is-primary': !error, 'is-disabled': disabled }">
        <span class="numeric-prefix">{{ currencySymbol }}</span>
        <input
          type="text"
          ref="input"
          class="input"
          :name="name"
          :value="formattedValue"
          :maxlength="maxLength"
          :placeholder="placeholder"
          :disabled="disabled"
          @input="updateValue"
        />
      </div>
      <div v-if="$slots.addon" class="numeric-addon">
        <slot name="addon" />
      </div>
    </div>
    <p class="help is-danger">{{ error }}</p>
  </div>
</template>

<style scoped>
.label.has-extra {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.label-extra :deep(.button) {
  font-weight: 400;
  white-space: nowrap;
}

.numeric-row {
  display: flex;
  align-items: stretch;
  gap: 0.3rem;
}

.numeric-control {
  display: flex;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.1);
}

.numeric-addon {
  flex: 0 0 auto;
  display: flex;
}

.numeric-addon :deep(.button) {
  height: auto;
}

@media screen and (max-width: 480px) {
  .numeric-row:has(.numeric-addon) {
    flex-wrap: wrap;
  }

  .numeric-addon {
    flex: 1 1 100%;
  }

  .numeric-addon :deep(.button) {
    width: 100%;
    height: calc(2.25em + 2px);
  }
}

.numeric-control.is-primary {
  border-color: #00d1b2;
}

.numeric-control.is-danger {
  border-color: #ff3860;
}

.numeric-control.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.numeric-prefix {
  display: flex;
  align-items: center;
  padding: 0 0.75em;
  background: whitesmoke;
  border-right: 1px solid #dbdbdb;
  color: #7a7a7a;
}

.numeric-control .input,
.numeric-control .input:focus,
.numeric-control .input:active {
  flex: 1;
  min-width: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.numeric-control.is-disabled .input[disabled] {
  background-color: whitesmoke;
  color: #7a7a7a;
  -webkit-text-fill-color: #7a7a7a;
  opacity: 1;
}
</style>
