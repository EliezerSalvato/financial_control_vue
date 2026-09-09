import type { InboxFeedEvent, InboxNotification, InboxNotificationBroadcast } from '@/types/inbox_notification';
import { defineStore } from 'pinia';
import { listNotifications, readAllNotifications, readNotification } from '@/api/notifications';
import { useUserStore } from '@/stores/user';
import { ref } from 'vue';

export const PREVIEW_LIMIT = 10;

export const useInboxNotificationsStore = defineStore('inboxNotifications', () => {
  const unreadCount = ref(0);
  const previewItems = ref<InboxNotification[]>([]);
  const previewLoading = ref(false);
  const previewLoadingMore = ref(false);
  const previewHasMore = ref(false);
  const previewNextCursor = ref<string | null>(null);
  const previewUnreadOnly = ref(false);
  const feedEvent = ref<InboxFeedEvent | null>(null);
  const feedSeq = ref(0);
  let previewRequestId = 0;

  function emitFeed(event: InboxFeedEvent) {
    feedEvent.value = event;
    feedSeq.value += 1;
  }

  function listParams(after?: string) {
    return {
      limit: PREVIEW_LIMIT,
      after,
      unread: previewUnreadOnly.value || undefined,
    };
  }

  function upsertPreview(notification: InboxNotification, prepend: boolean) {
    if (previewUnreadOnly.value && notification.read) {
      previewItems.value = previewItems.value.filter((item) => item.id !== notification.id);
      return;
    }

    const index = previewItems.value.findIndex((item) => item.id === notification.id);

    if (index === -1) {
      if (!prepend) return;

      previewItems.value = [notification, ...previewItems.value];
      return;
    }

    const rest = previewItems.value.filter((item) => item.id !== notification.id);

    if (prepend) {
      previewItems.value = [notification, ...rest];
      return;
    }

    previewItems.value = [...previewItems.value.slice(0, index), notification, ...previewItems.value.slice(index + 1)];
  }

  function applyReadLocally(notification: InboxNotification, previousRead: boolean) {
    upsertPreview(notification, false);

    if (!previousRead && unreadCount.value > 0) {
      unreadCount.value -= 1;
    }

    emitFeed({ type: 'read', notification });
  }

  async function loadPreview(unreadOnly = false) {
    const currentRequest = ++previewRequestId;
    previewUnreadOnly.value = unreadOnly;
    previewLoading.value = true;
    previewLoadingMore.value = false;
    previewItems.value = [];
    previewHasMore.value = false;
    previewNextCursor.value = null;

    try {
      const result = await listNotifications(listParams());

      if (currentRequest !== previewRequestId) return;

      previewItems.value = result.notifications;
      unreadCount.value = result.pagination.unreadCount;
      previewHasMore.value = result.pagination.hasMore;
      previewNextCursor.value = result.pagination.nextCursor;
    } finally {
      if (currentRequest === previewRequestId) {
        previewLoading.value = false;
      }
    }
  }

  async function loadMorePreview() {
    if (previewLoading.value || previewLoadingMore.value || !previewHasMore.value || !previewNextCursor.value) {
      return;
    }

    const currentRequest = previewRequestId;
    previewLoadingMore.value = true;

    try {
      const result = await listNotifications(listParams(previewNextCursor.value));

      if (currentRequest !== previewRequestId) return;

      const incoming = result.notifications.filter((item) => !previewItems.value.some((current) => current.id === item.id));

      previewItems.value = [...previewItems.value, ...incoming];
      previewHasMore.value = result.pagination.hasMore && incoming.length > 0;
      previewNextCursor.value = result.pagination.nextCursor;
      unreadCount.value = result.pagination.unreadCount;
    } finally {
      if (currentRequest === previewRequestId) {
        previewLoadingMore.value = false;
      }
    }
  }

  async function markAsRead(id: string, previousRead = false) {
    const result = await readNotification(id);

    applyReadLocally(result.notification, previousRead);

    return result;
  }

  async function markAllAsRead() {
    const result = await readAllNotifications();

    unreadCount.value = 0;
    previewItems.value = previewUnreadOnly.value
      ? []
      : previewItems.value.map((item) => ({
          ...item,
          read: true,
        }));
    emitFeed({ type: 'readAll' });

    return result;
  }

  function setUnreadCount(value: number) {
    unreadCount.value = value;
  }

  function applyBroadcast(payload: InboxNotificationBroadcast) {
    const currentUserId = useUserStore().user?.id;

    if (payload.userId && currentUserId && payload.userId !== currentUserId) {
      return;
    }

    unreadCount.value = payload.unreadCount;

    if (payload.notification) {
      upsertPreview(payload.notification, true);
      emitFeed({ type: 'prepend', notification: payload.notification });
      return;
    }

    emitFeed({ type: 'reload' });
    void loadPreview(previewUnreadOnly.value).catch(() => {});
  }

  function reset() {
    unreadCount.value = 0;
    previewItems.value = [];
    previewLoading.value = false;
    previewLoadingMore.value = false;
    previewHasMore.value = false;
    previewNextCursor.value = null;
    previewUnreadOnly.value = false;
    feedEvent.value = null;
    feedSeq.value = 0;
    previewRequestId += 1;
  }

  return {
    unreadCount,
    previewItems,
    previewLoading,
    previewLoadingMore,
    previewHasMore,
    feedEvent,
    feedSeq,
    loadPreview,
    loadMorePreview,
    markAsRead,
    markAllAsRead,
    applyBroadcast,
    setUnreadCount,
    reset,
  };
});
