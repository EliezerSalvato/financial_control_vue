<script setup lang="ts">
import { useDropdownPlacement } from '@/composables/useDropdownPlacement';
import { useSelectTypeahead } from '@/composables/useSelectTypeahead';
import { useI18n } from 'vue-i18n';
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';

export type ColorOption = {
  key: string;
  label: string;
  color?: string | null;
  url?: string | null;
};

const { t } = useI18n();
const model = defineModel<string>({ default: '' });

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
  'change:selected': [payload: { name?: string; value: string }];
}>();

const root = useTemplateRef<HTMLElement>('root');
const trigger = useTemplateRef<HTMLButtonElement>('trigger');
const menu = useTemplateRef<HTMLElement>('menu');
const isOpen = ref(false);
const { menuStyle } = useDropdownPlacement(isOpen, trigger, menu);
const { findIndex, clearQuery } = useSelectTypeahead();

const selectedItem = computed(() => props.items.find((item) => item.key === model.value) ?? null);

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

function select(item: ColorOption) {
  model.value = item.key;
  isOpen.value = false;
  emit('change:selected', { name: props.name, value: item.key });
}

function currentItemIndex() {
  return props.items.findIndex((item) => item.key === model.value);
}

async function jumpToItem(index: number) {
  const item = props.items[index];
  if (!item) return;

  model.value = item.key;
  emit('change:selected', { name: props.name, value: item.key });
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
    currentItemIndex(),
  );

  if (index < 0) return;

  event.preventDefault();
  void jumpToItem(index);
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as Node;

  if (!root.value?.contains(target) && !menu.value?.contains(target)) {
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
  <div ref="root" class="option-select" @keydown="onKeydown">
    <label v-if="label" class="label" :for="name" @click="focus">
      {{ label }}
      <abbr v-if="label && required" :title="t('required')">*</abbr>
    </label>

    <div class="option-select-row">
      <div class="option-select-control">
        <button
          :id="name"
          ref="trigger"
          type="button"
          class="option-select-trigger input"
          :class="{ 'is-danger': error, 'is-primary': !error, 'is-open': isOpen }"
          :disabled="!!disabled"
          :aria-expanded="isOpen"
          aria-haspopup="listbox"
          @click="toggle"
        >
          <span v-if="selectedItem" class="option-select-value">
            <span
              v-if="selectedItem.color"
              class="option-select-swatch"
              :title="selectedItem.color"
              :style="{ backgroundColor: selectedItem.color }"
            ></span>
            <img v-else-if="selectedItem.url" class="option-select-image" :src="selectedItem.url" :alt="selectedItem.label" />
            <span>{{ selectedItem.label }}</span>
          </span>
          <span v-else class="option-select-placeholder">{{ placeholder }}</span>
          <span class="option-select-caret" aria-hidden="true">
            <i class="fas fa-caret-down"></i>
          </span>
        </button>

        <Teleport to="body">
          <ul v-if="isOpen" ref="menu" class="option-select-menu" :style="menuStyle" role="listbox">
            <li v-for="item in items" :key="item.key" role="option" :aria-selected="item.key === model">
              <button type="button" class="option-select-option" :class="{ 'is-selected': item.key === model }" @click="select(item)">
                <span v-if="item.color" class="option-select-swatch" :title="item.color" :style="{ backgroundColor: item.color }"></span>
                <img v-else-if="item.url" class="option-select-image" :src="item.url" :alt="item.label" />
                <span>{{ item.label }}</span>
              </button>
            </li>
          </ul>
        </Teleport>
      </div>

      <div v-if="$slots.addon" class="option-select-addon" @click="isOpen = false">
        <slot name="addon" />
      </div>
    </div>

    <p class="help is-danger">{{ error }}</p>
  </div>
</template>

<style scoped>
.option-select-row {
  display: flex;
  align-items: stretch;
  gap: 0.3rem;
}

.option-select-control {
  position: relative;
  flex: 1;
  min-width: 0;
}

.option-select-addon {
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
}

.option-select-addon :deep(.button) {
  height: auto;
}

.option-select-trigger {
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

.option-select-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.option-select-value {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.option-select-value > span:last-child,
.option-select-placeholder {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-select-placeholder {
  color: #ccc;
}

.option-select-swatch {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
}

.option-select-image {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
  flex-shrink: 0;
}

.option-select-caret {
  position: absolute;
  right: 0.75rem;
  color: #7a7a7a;
  pointer-events: none;
}

.option-select-menu {
  z-index: 50;
  max-height: 16rem;
  padding: 0.35rem 0;
  overflow-y: auto;
  list-style: none;
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1);
}

.option-select-option {
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

.option-select-option > span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-select-option:hover,
.option-select-option.is-selected {
  background: #f5f5f5;
}

.option-select-option.is-selected {
  font-weight: 600;
}
</style>
