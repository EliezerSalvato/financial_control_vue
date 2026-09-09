<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, useTemplateRef } from 'vue';

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const { t } = useI18n();
const model = defineModel<string>({ default: '#000000' });

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    errors: string[];
    required?: boolean;
  }>(),
  {
    required: false,
  },
);

const emit = defineEmits<{
  'change:value': [payload: { name?: string; value: string }];
}>();

const hexInput = useTemplateRef<HTMLInputElement>('hexInput');
const colorInput = useTemplateRef<HTMLInputElement>('colorInput');

const solidHex = computed(() => toSolidHex(model.value));

function expandHex(hex: string): string {
  const value = hex.replace('#', '').toLowerCase();

  if (value.length === 3) {
    return `#${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`;
  }

  return `#${value}`;
}

function toSolidHex(hex: string): string {
  if (!HEX_PATTERN.test(hex)) {
    return '#000000';
  }

  return expandHex(hex);
}

function commit(value: string) {
  model.value = value;
  emit('change:value', { name: props.name, value });
}

function updateFromColor(event: Event) {
  commit((event.target as HTMLInputElement).value.toLowerCase());
}

function updateFromHex(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim();

  if (!HEX_PATTERN.test(value)) {
    model.value = value;
    emit('change:value', { name: props.name, value });
    return;
  }

  commit(expandHex(value));
}

function openColorPicker() {
  colorInput.value?.click();
}

function focus() {
  hexInput.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <div class="field">
    <div class="control">
      <label v-if="label" class="label" :for="name" @click="focus">
        {{ label }}
        <abbr v-if="required" :title="t('required')">*</abbr>
      </label>

      <div class="color-picker" :class="{ 'is-danger': errors.length > 0 }">
        <button type="button" class="color-swatch" :aria-label="label" @click="openColorPicker">
          <span class="color-swatch-fill" :style="{ backgroundColor: solidHex }"></span>
        </button>

        <input ref="colorInput" type="color" class="color-native" :value="solidHex" tabindex="-1" @input="updateFromColor" />

        <input
          ref="hexInput"
          type="text"
          class="input hex-input"
          :name="name"
          :value="model"
          maxlength="7"
          placeholder="#000000"
          :class="errors.length > 0 ? 'is-danger' : 'is-primary'"
          @input="updateFromHex"
        />
      </div>

      <p class="help is-danger">{{ errors[0] }}</p>
    </div>
  </div>
</template>

<style scoped>
.color-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.color-swatch {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  background-color: #fff;
}

.color-swatch-fill {
  display: block;
  width: 100%;
  height: 100%;
}

.color-native {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.hex-input {
  width: 8.5rem;
  max-width: 100%;
  text-transform: lowercase;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.color-picker.is-danger .color-swatch {
  border-color: #ff3860;
}
</style>
