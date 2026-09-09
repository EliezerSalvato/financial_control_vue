<script setup lang="ts">
import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import { useTemplateRef } from 'vue';
import ColorSelect from '@/components/inputs/ColorSelect.vue';

export type LogoOption = ColorOption;

const model = defineModel<string>({ default: '' });

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    error?: string;
    placeholder?: string;
    items?: LogoOption[];
    required?: boolean;
    disabled?: boolean | string | null;
  }>(),
  {
    items: () => [],
    required: false,
    disabled: null,
  },
);

const emit = defineEmits<{
  'change:selected': [payload: { name?: string; value: string }];
}>();

const select = useTemplateRef<{ focus: () => void }>('select');

function focus() {
  select.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <ColorSelect ref="select" v-model="model" v-bind="props" @change:selected="emit('change:selected', $event)">
    <template v-if="$slots.addon" #addon>
      <slot name="addon" />
    </template>
  </ColorSelect>
</template>
