<script setup lang="ts">
import { useDropdownPlacement } from '@/composables/useDropdownPlacement';
import { useSelectTypeahead } from '@/composables/useSelectTypeahead';
import { useI18n } from 'vue-i18n';
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';

type SelectItem = { id: string | number; description: string };

const { t } = useI18n();
const model = defineModel<string | number | null>();

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    error?: string;
    placeholder?: string;
    items?: SelectItem[] | Record<string, string>;
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
  'change:selected': [payload: { name?: string; value: string | number | null | undefined }];
}>();

const root = useTemplateRef<HTMLElement>('root');
const trigger = useTemplateRef<HTMLButtonElement>('trigger');
const menu = useTemplateRef<HTMLElement>('menu');
const isOpen = ref(false);
const { opensUp } = useDropdownPlacement(isOpen, trigger, menu);
const { findIndex, clearQuery } = useSelectTypeahead();

const normalizedItems = computed<SelectItem[]>(() => {
  if (Array.isArray(props.items)) {
    return props.items;
  }

  return Object.entries(props.items ?? {}).map(([id, description]) => ({ id, description }));
});

const selectedItem = computed(() => normalizedItems.value.find((item) => String(item.id) === String(model.value ?? '')) ?? null);

const triggerTitle = computed(() => selectedItem.value?.description || props.placeholder);

const hasValue = computed(() => model.value !== null && model.value !== undefined && model.value !== '');

watch(isOpen, (open) => {
  if (!open) clearQuery();
});

function focus() {
  trigger.value?.focus();
}

function toggle() {
  if (props.disabled) return;

  isOpen.value = !isOpen.value;
}

function select(value: string | number | null) {
  model.value = value;
  isOpen.value = false;
  emit('change:selected', { name: props.name, value });
}

function currentItemIndex() {
  return normalizedItems.value.findIndex((item) => String(item.id) === String(model.value ?? ''));
}

async function jumpToItem(index: number) {
  const item = normalizedItems.value[index];
  if (!item) return;

  model.value = item.id;
  emit('change:selected', { name: props.name, value: item.id });
  isOpen.value = true;

  await nextTick();

  const options = menu.value?.querySelectorAll<HTMLElement>('[role="option"]');
  // +1 skips the placeholder option
  options?.[index + 1]?.scrollIntoView({ block: 'nearest' });
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === 'Escape') {
    isOpen.value = false;
    return;
  }

  const index = findIndex(
    normalizedItems.value.map((item) => item.description),
    event.key,
    currentItemIndex(),
  );

  if (index < 0) return;

  event.preventDefault();
  void jumpToItem(index);
}

function onDocumentClick(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
});

defineExpose({ focus });
</script>

<template>
  <div ref="root" class="custom-select" @keydown="onKeydown">
    <label v-if="label" class="label" :for="name" @click="focus">
      {{ label }}
      <abbr v-if="label && required" :title="t('required')">*</abbr>
    </label>

    <div class="custom-select-control">
      <button
        :id="name"
        ref="trigger"
        type="button"
        class="custom-select-trigger input"
        :class="{ 'is-danger': error, 'is-primary': !error, 'is-open': isOpen }"
        :disabled="!!disabled"
        :title="triggerTitle"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        @click="toggle"
      >
        <span v-if="selectedItem" class="custom-select-value">{{ selectedItem.description }}</span>
        <span v-else class="custom-select-placeholder">{{ placeholder }}</span>
        <span class="custom-select-caret" aria-hidden="true">
          <i class="fas fa-caret-down"></i>
        </span>
      </button>

      <ul v-show="isOpen" ref="menu" class="custom-select-menu" :class="{ 'is-up': opensUp }" role="listbox">
        <li role="option" :aria-selected="!hasValue">
          <button type="button" class="custom-select-option" :class="{ 'is-selected': !hasValue }" @click="select('')">
            <span class="custom-select-placeholder">{{ placeholder }}</span>
          </button>
        </li>
        <li v-for="item in normalizedItems" :key="item.id" role="option" :aria-selected="String(item.id) === String(model ?? '')">
          <button
            type="button"
            class="custom-select-option"
            :class="{ 'is-selected': String(item.id) === String(model ?? '') }"
            :title="item.description"
            @click="select(item.id)"
          >
            <span>{{ item.description }}</span>
          </button>
        </li>
      </ul>
    </div>

    <p class="help is-danger">{{ error }}</p>
  </div>
</template>

<style scoped>
.custom-select-control {
  position: relative;
}

.custom-select-trigger {
  display: flex;
  align-items: center;
  width: 100%;
  height: 2.25em;
  max-height: 2.25em;
  padding-right: 2.25rem;
  overflow: hidden;
  line-height: 1.5;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.1);
}

.custom-select-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.custom-select-value,
.custom-select-placeholder {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select-placeholder {
  color: #ccc;
}

.custom-select-caret {
  position: absolute;
  right: 0.75rem;
  color: #7a7a7a;
  pointer-events: none;
}

.custom-select-menu {
  position: absolute;
  z-index: 20;
  top: 100%;
  left: 0;
  right: auto;
  width: max-content;
  min-width: 100%;
  max-height: 16rem;
  margin: 0.15rem 0 0;
  padding: 0.35rem 0;
  overflow-y: auto;
  list-style: none;
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1);
}

.custom-select-menu.is-up {
  top: auto;
  bottom: 100%;
  margin: 0 0 0.15rem;
}

.custom-select-option {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: #363636;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.custom-select-option:hover,
.custom-select-option.is-selected {
  background: #f5f5f5;
}

.custom-select-option.is-selected {
  font-weight: 600;
}
</style>
