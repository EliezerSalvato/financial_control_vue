<script setup lang="ts">
import type { AppLocale } from '@/locales/locale';
import { applyAppLocale, syncProfileLocale } from '@/composables/useProfileLocaleSync';
import { useI18n } from 'vue-i18n';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const { locale } = useI18n();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

const options: { code: AppLocale; flag: string; label: string }[] = [
  { code: 'en', flag: '🇺🇸', label: 'English (United States)' },
  { code: 'pt-BR', flag: '🇧🇷', label: 'Português (Brasil)' },
];

const current = computed(() => options.find((option) => option.code === locale.value) ?? options[0]);

function toggle() {
  open.value = !open.value;
}

function close() {
  open.value = false;
}

function selectLocale(next: AppLocale) {
  if (locale.value !== next) {
    applyAppLocale(next);
    void syncProfileLocale(next);
  }

  close();
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
});
</script>

<template>
  <div ref="root" class="navbar-item locale-switcher">
    <div class="dropdown" :class="{ 'is-active': open }">
      <div class="dropdown-trigger">
        <a
          class="locale-trigger"
          href="#"
          role="button"
          :aria-expanded="open"
          aria-haspopup="true"
          :aria-label="current?.label ?? ''"
          @click.prevent="toggle"
        >
          <span class="locale-flag" aria-hidden="true">{{ current?.flag }}</span>
        </a>
      </div>

      <div class="dropdown-menu" role="menu">
        <div class="dropdown-content">
          <a
            v-for="option in options"
            :key="option.code"
            href="#"
            class="dropdown-item"
            :class="{ 'is-active': locale === option.code }"
            @click.prevent="selectLocale(option.code)"
          >
            <span class="locale-flag" aria-hidden="true">{{ option.flag }}</span>
            <span>{{ option.label }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.locale-switcher {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.locale-trigger {
  align-items: center;
  color: inherit;
  display: flex;
  line-height: 1;
}

.locale-switcher .dropdown-item {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  padding-right: 1rem;
}

.locale-flag {
  font-size: 1.25rem;
  line-height: 1;
}
</style>
