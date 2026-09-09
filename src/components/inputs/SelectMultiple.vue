<script setup lang="ts">
import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import { useDropdownPlacement } from '@/composables/useDropdownPlacement';
import { useSelectTypeahead } from '@/composables/useSelectTypeahead';
import { useI18n } from 'vue-i18n';
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';

const { t } = useI18n();
const model = defineModel<string[]>({ default: () => [] });

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    error?: string;
    placeholder?: string;
    items?: ColorOption[];
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
  'change:selected': [payload: { name?: string; value: string[] }];
}>();

const root = useTemplateRef<HTMLElement>('root');
const trigger = useTemplateRef<HTMLButtonElement>('trigger');
const menu = useTemplateRef<HTMLElement>('menu');
const isOpen = ref(false);
const highlightedIndex = ref(-1);
const { opensUp } = useDropdownPlacement(isOpen, trigger, menu);
const { findIndex, clearQuery } = useSelectTypeahead();

const selectedItems = computed(() => props.items.filter((item) => model.value.includes(item.key)));

const selectedKeys = computed(() => new Set(model.value));

watch(isOpen, (open) => {
  if (!open) {
    clearQuery();
    highlightedIndex.value = -1;
  }
});

function focus() {
  trigger.value?.focus();
}

function toggle() {
  if (props.disabled) return;

  isOpen.value = !isOpen.value;
}

function isSelected(key: string) {
  return selectedKeys.value.has(key);
}

function toggleItem(item: ColorOption) {
  if (props.disabled) return;

  const next = isSelected(item.key) ? model.value.filter((key) => key !== item.key) : [...model.value, item.key];

  model.value = next;
  emit('change:selected', { name: props.name, value: next });
}

function removeItem(key: string, event: MouseEvent) {
  event.stopPropagation();
  if (props.disabled) return;

  const next = model.value.filter((itemKey) => itemKey !== key);

  model.value = next;
  emit('change:selected', { name: props.name, value: next });
}

async function jumpToItem(index: number) {
  if (!props.items[index]) return;

  highlightedIndex.value = index;
  isOpen.value = true;

  await nextTick();

  const options = menu.value?.querySelectorAll<HTMLElement>('[role="option"]');
  options?.[index]?.scrollIntoView({ block: 'nearest' });
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === 'Escape') {
    isOpen.value = false;
    return;
  }

  const index = findIndex(
    props.items.map((item) => item.label),
    event.key,
    highlightedIndex.value,
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
  <div ref="root" class="multi-select" @keydown="onKeydown">
    <label v-if="label" class="label" :for="name" @click="focus">
      {{ label }}
      <abbr v-if="label && required" :title="t('required')">*</abbr>
    </label>

    <div class="multi-select-row">
      <div class="multi-select-control">
        <button
          :id="name"
          ref="trigger"
          type="button"
          class="multi-select-trigger input"
          :class="{ 'is-danger': error, 'is-primary': !error, 'is-open': isOpen }"
          :disabled="!!disabled"
          :aria-expanded="isOpen"
          aria-haspopup="listbox"
          @click="toggle"
        >
          <span v-if="selectedItems.length" class="multi-select-values">
            <span v-for="item in selectedItems" :key="item.key" class="multi-select-tag" @click.stop>
              <span v-if="item.color" class="multi-select-swatch" :title="item.color" :style="{ backgroundColor: item.color }"></span>
              <span>{{ item.label }}</span>
              <button type="button" class="multi-select-remove" :aria-label="item.label" :disabled="!!disabled" @click="removeItem(item.key, $event)">
                ×
              </button>
            </span>
          </span>
          <span v-else class="multi-select-placeholder">{{ placeholder }}</span>
          <span class="multi-select-caret" aria-hidden="true">
            <i class="fas fa-caret-down"></i>
          </span>
        </button>

        <ul v-show="isOpen" ref="menu" class="multi-select-menu" :class="{ 'is-up': opensUp }" role="listbox" aria-multiselectable="true">
          <li v-if="!items.length" class="multi-select-empty">{{ t('noResultsFound') }}</li>
          <li v-for="(item, index) in items" :key="item.key" role="option" :aria-selected="isSelected(item.key)">
            <button
              type="button"
              class="multi-select-option"
              :class="{ 'is-selected': isSelected(item.key), 'is-highlighted': highlightedIndex === index }"
              @click="toggleItem(item)"
            >
              <span v-if="item.color" class="multi-select-swatch" :title="item.color" :style="{ backgroundColor: item.color }"></span>
              <span>{{ item.label }}</span>
              <span v-if="isSelected(item.key)" class="multi-select-check" aria-hidden="true">
                <i class="fas fa-check"></i>
              </span>
            </button>
          </li>
        </ul>
      </div>

      <div v-if="$slots.addon" class="multi-select-addon" @click="isOpen = false">
        <slot name="addon" />
      </div>
    </div>

    <p class="help is-danger">{{ error }}</p>
  </div>
</template>

<style scoped>
.multi-select-row {
  display: flex;
  align-items: stretch;
  gap: 0.3rem;
}

.multi-select-control {
  position: relative;
  flex: 1;
  min-width: 0;
}

.multi-select-addon {
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
}

.multi-select-addon :deep(.button) {
  height: auto;
}

.multi-select-trigger {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 2.25em;
  height: auto;
  max-height: none;
  padding-top: 0.35rem;
  padding-bottom: 0.35rem;
  padding-right: 2.25rem;
  overflow: hidden;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  box-shadow: inset 0 1px 2px rgba(10, 10, 10, 0.1);
}

.multi-select-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.multi-select-values {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
}

.multi-select-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  padding: 0.1rem 0.35rem 0.1rem 0.35rem;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  font-size: 0.875rem;
}

.multi-select-tag > span:nth-child(2) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.multi-select-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #7a7a7a;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.multi-select-remove:hover {
  color: #363636;
}

.multi-select-placeholder {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #ccc;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.multi-select-swatch {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border: 1px solid #dbdbdb;
  border-radius: 3px;
}

.multi-select-caret {
  position: absolute;
  right: 0.75rem;
  color: #7a7a7a;
  pointer-events: none;
}

.multi-select-menu {
  position: absolute;
  z-index: 20;
  top: 100%;
  left: 0;
  right: 0;
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

.multi-select-menu.is-up {
  top: auto;
  bottom: 100%;
  margin: 0 0 0.15rem;
}

.multi-select-empty {
  padding: 0.5rem 0.75rem;
  color: #7a7a7a;
}

.multi-select-option {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  overflow: hidden;
  border: 0;
  background: transparent;
  color: #363636;
  text-align: left;
  cursor: pointer;
}

.multi-select-option > span:nth-child(2) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.multi-select-option:hover,
.multi-select-option.is-selected,
.multi-select-option.is-highlighted {
  background: #f5f5f5;
}

.multi-select-option.is-selected {
  font-weight: 600;
}

.multi-select-check {
  color: #00d1b2;
  flex-shrink: 0;
}
</style>
