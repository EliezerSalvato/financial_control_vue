<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useTemplateRef } from 'vue';

const { t } = useI18n();
const model = defineModel<string>();

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    errors: string[];
    placeholder?: string;
    required?: boolean;
    maxlength?: number;
    type?: 'text' | 'email' | 'password';
    autocomplete?: string;
  }>(),
  {
    required: false,
    maxlength: 250,
    type: 'text',
  },
);

const emit = defineEmits<{
  'change:value': [payload: { name?: string; value: string }];
}>();

const input = useTemplateRef<HTMLInputElement>('input');

function updateValue(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  model.value = value;
  emit('change:value', { name: props.name, value });
}

function focus() {
  input.value?.focus();
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
      <input
        :type="type"
        ref="input"
        class="input"
        :name="name"
        :value="model"
        :maxlength="maxlength"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :class="errors.length > 0 ? 'is-danger' : 'is-primary'"
        @input="updateValue"
      />
      <p class="help is-danger">{{ errors[0] }}</p>
    </div>
  </div>
</template>

<style scoped></style>
