<script setup lang="ts">
import type { InboxNotification } from '@/types/inbox_notification';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { listNotifications } from '@/api/notifications';
import { useInboxNotificationsStore } from '@/stores/inboxNotifications';
import { notifyApiError } from '@/utils/notifyApiError';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Loading from '@/components/Loading.vue';
import NotificationMessage from '@/components/NotificationMessage.vue';
import NotificationsListItem from '@/components/NotificationsListItem.vue';

const PAGE_LIMIT = 10;

const { t } = useI18n();
const inboxStore = useInboxNotificationsStore();
const { feedEvent, feedSeq, unreadCount } = storeToRefs(inboxStore);

const items = ref<InboxNotification[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const markingAll = ref(false);
const unreadOnly = ref(false);
const hasLoadedOnce = ref(false);
const hasMore = ref(false);
const nextCursor = ref<string | null>(null);
let requestId = 0;

const showLoading = computed(() => loading.value && !hasLoadedOnce.value);
const emptyMessage = computed(() => (unreadOnly.value ? t('notifications.emptyUnread') : t('notifications.empty')));

async function loadPage(reset: boolean) {
  const currentRequest = ++requestId;

  if (reset) {
    loading.value = true;
  } else {
    loadingMore.value = true;
  }

  try {
    const result = await listNotifications({
      limit: PAGE_LIMIT,
      after: reset ? undefined : (nextCursor.value ?? undefined),
      unread: unreadOnly.value || undefined,
    });

    if (currentRequest !== requestId) return;

    items.value = reset
      ? result.notifications
      : [...items.value, ...result.notifications.filter((item) => !items.value.some((current) => current.id === item.id))];
    hasMore.value = result.pagination.hasMore;
    nextCursor.value = result.pagination.nextCursor;
    inboxStore.setUnreadCount(result.pagination.unreadCount);
  } catch (error) {
    if (currentRequest !== requestId) return;

    notifyApiError(error);
  } finally {
    if (currentRequest === requestId) {
      loading.value = false;
      loadingMore.value = false;
      hasLoadedOnce.value = true;
    }
  }
}

function prependItem(notification: InboxNotification) {
  if (unreadOnly.value && notification.read) return;

  items.value = [notification, ...items.value.filter((item) => item.id !== notification.id)];
}

function replaceItem(notification: InboxNotification) {
  if (unreadOnly.value && notification.read) {
    items.value = items.value.filter((item) => item.id !== notification.id);
    return;
  }

  items.value = items.value.map((item) => (item.id === notification.id ? notification : item));
}

function scrollingRoot() {
  return document.scrollingElement ?? document.documentElement;
}

function isNearBottom() {
  const el = scrollingRoot();

  return el.scrollHeight - el.scrollTop - el.clientHeight <= 96;
}

async function loadMoreIfNeeded() {
  await nextTick();

  const el = scrollingRoot();

  if (el.scrollHeight > el.clientHeight && !isNearBottom()) return;

  await loadMore();
}

async function loadMore() {
  if (!hasMore.value || loading.value || loadingMore.value || !nextCursor.value) return;

  const beforeCount = items.value.length;

  await loadPage(false);

  if (items.value.length === beforeCount) return;

  await loadMoreIfNeeded();
}

function onWindowScroll() {
  if (!isNearBottom()) return;

  void loadMore();
}

async function onToggleUnreadOnly() {
  unreadOnly.value = !unreadOnly.value;
  await loadPage(true);
  window.scrollTo(0, 0);
  await loadMoreIfNeeded();
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

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll, { passive: true });
  void loadPage(true).then(() => loadMoreIfNeeded());
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onWindowScroll);
});

watch(feedSeq, () => {
  const event = feedEvent.value;

  if (!event || !hasLoadedOnce.value) return;

  if (event.type === 'reload') {
    void loadPage(true).then(() => loadMoreIfNeeded());
    return;
  }

  if (event.type === 'prepend') {
    prependItem(event.notification);
    return;
  }

  if (event.type === 'read') {
    replaceItem(event.notification);
    return;
  }

  if (event.type === 'readAll') {
    if (unreadOnly.value) {
      items.value = [];
      hasMore.value = false;
      nextCursor.value = null;
      return;
    }

    items.value = items.value.map((item) => (item.read ? item : { ...item, read: true }));
  }
});
</script>

<template>
  <div class="columns">
    <Loading v-show="showLoading" />

    <div v-show="!showLoading" class="column">
      <NotificationMessage />

      <nav class="panel">
        <p class="panel-heading">
          <span class="panel-heading-heading">
            <span class="panel-heading-title">{{ t('notifications.title') }}</span>
            <span v-if="unreadCount > 0" class="tag is-danger is-rounded">{{ t('notifications.unreadCount', { count: unreadCount }) }}</span>
          </span>
          <span class="panel-heading-aside">
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
          </span>
        </p>

        <div class="panel-block inbox-list">
          <p v-if="!items.length" class="inbox-empty">{{ emptyMessage }}</p>

          <div v-else class="inbox-items">
            <NotificationsListItem v-for="item in items" :key="item.id" :item="item" />
          </div>

          <div v-if="hasMore || loadingMore" class="inbox-sentinel">
            <span v-show="loadingMore" class="button is-small is-white is-loading" aria-hidden="true"></span>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.columns {
  margin: 0 auto;
  max-width: 1344px;
}

.panel-heading {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
}

.panel-heading-heading {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.panel-heading-title {
  text-transform: capitalize;
}

.panel-heading-aside {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.inbox-list {
  display: block;
  padding: 0;
}

.inbox-items {
  display: flex;
  flex-direction: column;
}

.inbox-empty {
  color: #7a7a7a;
  margin: 0;
  padding: 1.5rem 1rem;
  text-align: center;
}

.inbox-sentinel {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.5rem;
}
</style>
