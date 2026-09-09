<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useTemplateRef } from 'vue';

const { t } = useI18n();
const model = defineModel<number | null>();

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    error?: string;
    placeholder?: string;
    minValue?: number;
    maxValue?: number;
    required?: boolean;
    maxLength?: number;
    disabled?: boolean;
  }>(),
  {
    required: false,
    maxLength: 2,
    disabled: false,
  },
);

const emit = defineEmits<{
  'change:value': [payload: { name?: string; value: number | null }];
}>();

const input = useTemplateRef<HTMLInputElement>('input');

function isNumber(event: Event, value: string) {
  if (event instanceof InputEvent && !event.inputType.includes('delete')) {
    if (isNaN((event.target as HTMLInputElement).valueAsNumber)) {
      return false;
    }
  }

  if (value.length > props.maxLength) {
    return false;
  }

  if (props.maxValue != null && Number(value) > props.maxValue) {
    return false;
  }

  if (props.minValue != null && value !== '' && Number(value) < props.minValue) {
    return false;
  }

  return true;
}

function updateValue(event: Event) {
  if (props.disabled) return;

  const target = event.target as HTMLInputElement;
  let value: string | number | null = target.value;

  if (!isNumber(event, value)) {
    target.value = model.value != null ? String(model.value) : '';
    return;
  }

  value = value ? Number(value) : null;

  model.value = value;
  emit('change:value', { name: props.name, value });
}

function focus() {
  input.value?.focus();
}
</script>

<template>
  <div>
    <label v-if="label" class="label" :for="name" @click="focus">
      {{ label }}
      <abbr v-if="label && required" :title="t('required')">*</abbr>
    </label>
    <input
      type="number"
      ref="input"
      class="input"
      :name="name"
      :value="model"
      :min="minValue"
      :max="maxValue"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="{ 'is-danger': error, 'is-primary': !error }"
      @input="updateValue"
    />
    <p class="help is-danger">{{ error }}</p>
  </div>
</template>

<style scoped>
.input[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: whitesmoke;
  color: #7a7a7a;
  -webkit-text-fill-color: #7a7a7a;
  box-shadow: none;
}

.input[disabled].is-primary {
  border-color: #00d1b2;
}

.input[disabled].is-danger {
  border-color: #ff3860;
}
</style>
