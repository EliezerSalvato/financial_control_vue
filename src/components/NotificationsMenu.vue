<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useInboxNotificationsStore } from '@/stores/inboxNotifications';
import { notifyApiError } from '@/utils/notifyApiError';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Loading from '@/components/Loading.vue';
import NotificationsListItem from '@/components/NotificationsListItem.vue';

const props = withDefaults(
  defineProps<{
    closeMenu: () => void;
    inBrand?: boolean;
  }>(),
  { inBrand: false },
);

const { t } = useI18n();
const router = useRouter();
const inboxStore = useInboxNotificationsStore();
const { previewHasMore, previewItems, previewLoading, previewLoadingMore, unreadCount } = storeToRefs(inboxStore);

const open = ref(false);
const unreadOnly = ref(false);
const markingAll = ref(false);
const root = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const listEl = ref<HTMLElement | null>(null);

const emptyMessage = computed(() => (unreadOnly.value ? t('notifications.emptyUnread') : t('notifications.empty')));
const badgeLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)));

function close() {
  open.value = false;
}

function isNearBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= 96;
}

async function loadMoreIfNeeded() {
  await nextTick();
  const el = listEl.value;
  if (!el) return;

  if (el.scrollHeight > el.clientHeight && !isNearBottom(el)) return;

  await loadMore();
}

async function loadMore() {
  if (!open.value || previewLoading.value || previewLoadingMore.value || !previewHasMore.value) return;

  const beforeCount = previewItems.value.length;

  try {
    await inboxStore.loadMorePreview();
  } catch (error) {
    notifyApiError(error);
    return;
  }

  if (previewItems.value.length === beforeCount) return;

  await loadMoreIfNeeded();
}

function onListScroll() {
  const el = listEl.value;
  if (!el || !isNearBottom(el)) return;

  void loadMore();
}

async function toggle() {
  if (open.value) {
    close();
    return;
  }

  unreadOnly.value = false;
  open.value = true;
  props.closeMenu();

  try {
    await inboxStore.loadPreview(unreadOnly.value);
    await loadMoreIfNeeded();
  } catch (error) {
    notifyApiError(error);
  }
}

async function onToggleUnreadOnly() {
  unreadOnly.value = !unreadOnly.value;

  try {
    await inboxStore.loadPreview(unreadOnly.value);
    if (listEl.value) listEl.value.scrollTop = 0;

    await loadMoreIfNeeded();
  } catch (error) {
    notifyApiError(error);
  }
}

function goToIndex() {
  close();
  props.closeMenu();
  void router.push({ name: 'notifications' });
}

function onSelectItem() {
  close();
  props.closeMenu();
}

async function onMarkAllAsRead() {
  if (unreadCount.value === 0 || markingAll.value) return;

  markingAll.value = true;

  try {
    await inboxStore.markAllAsRead();
  } catch (error) {
    notifyApiError(error);
  } finally {
    markingAll.value = false;
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!open.value) return;

  const target = event.target as Node;

  if (root.value?.contains(target) || panelEl.value?.contains(target)) return;

  close();
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('keydown', onDocumentKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  document.removeEventListener('keydown', onDocumentKeyDown);
});
</script>

<template>
  <a
    ref="root"
    class="navbar-item notifications-menu"
    :class="{
      'is-active': open,
      'is-hidden-desktop': inBrand,
      'is-hidden-touch': !inBrand,
    }"
    href="#"
    role="button"
    :aria-expanded="open"
    aria-haspopup="true"
    :title="t('menu.notifications')"
    :aria-label="t('menu.notifications')"
    @click.stop.prevent="toggle"
  >
    <span class="icon notifications-icon">
      <i class="fas fa-bell"></i>
      <span v-if="unreadCount > 0" class="notifications-badge">{{ badgeLabel }}</span>
    </span>
  </a>

  <Teleport to="body">
    <aside v-if="open" ref="panelEl" class="notifications-panel" role="dialog" :aria-label="t('menu.notifications')" @pointerdown.stop>
      <header class="notifications-panel-header">
        <div class="notifications-panel-heading">
          <strong>{{ t('notifications.title') }}</strong>
          <span v-if="unreadCount > 0" class="tag is-danger is-rounded">{{ t('notifications.unreadCount', { count: unreadCount }) }}</span>
        </div>
        <button type="button" class="delete" :aria-label="t('notifications.close')" @click="close"></button>
      </header>

      <div class="notifications-panel-actions">
        <button type="button" class="button is-small" :class="{ 'is-link': unreadOnly }" @click="onToggleUnreadOnly">
          {{ unreadOnly ? t('notifications.showAll') : t('notifications.unreadOnly') }}
        </button>
        <button
          type="button"
          class="button is-small"
          :class="{ 'is-loading': markingAll }"
          :disabled="unreadCount === 0 || markingAll"
          @click="onMarkAllAsRead"
        >
          {{ t('notifications.markAllAsRead') }}
        </button>
        <button type="button" class="button is-small is-primary" @click="goToIndex">
          {{ t('notifications.viewAll') }}
        </button>
      </div>

      <div ref="listEl" class="notifications-panel-list" @scroll.passive="onListScroll">
        <Loading v-if="previewLoading && !previewItems.length" />
        <template v-else>
          <p v-if="!previewItems.length" class="notifications-empty">{{ emptyMessage }}</p>
          <NotificationsListItem v-for="item in previewItems" :key="item.id" :item="item" @select="onSelectItem" />
          <div v-if="previewHasMore || previewLoadingMore" class="notifications-panel-sentinel">
            <span v-show="previewLoadingMore" class="button is-small is-white is-loading" aria-hidden="true"></span>
          </div>
        </template>
      </div>
    </aside>
  </Teleport>
</template>

<style scoped>
.notifications-menu {
  gap: 0.35rem;
}

.navbar-brand .notifications-menu {
  margin-left: auto;
}

.notifications-icon {
  position: relative;
}

.notifications-badge {
  align-items: center;
  background-color: #ff3860;
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  font-size: 0.65rem;
  font-weight: 700;
  justify-content: center;
  line-height: 1;
  min-width: 1.1rem;
  padding: 0.15rem 0.28rem;
  position: absolute;
  right: -0.45rem;
  top: -0.35rem;
}

.notifications-panel {
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 6px 6px 0 0;
  box-shadow: 0 8px 24px rgba(10, 10, 10, 0.15);
  display: flex;
  flex-direction: column;
  height: calc(100vh - 3.5rem);
  height: calc(100dvh - 3.5rem);
  max-width: calc(100vw - 1.5rem);
  overflow: hidden;
  position: fixed;
  right: 0.75rem;
  top: 3.5rem;
  width: 22.5rem;
  z-index: 40;
}

.notifications-panel-header {
  align-items: center;
  border-bottom: 1px solid #ededed;
  display: flex;
  flex-shrink: 0;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.75rem 1rem;
}

.notifications-panel-heading {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.notifications-panel-actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.75rem 1rem;
}

.notifications-panel-list {
  border-top: 1px solid #ededed;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: scroll;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.notifications-empty {
  color: #7a7a7a;
  margin: 0;
  padding: 1.25rem 1rem;
  text-align: center;
}

.notifications-panel-sentinel {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.5rem;
}
</style>
