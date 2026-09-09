import type {
  InboxNotification,
  InboxNotificationAttributesApi,
  InboxNotificationBroadcast,
  InboxNotificationCollectionResponseApi,
  InboxNotificationListResult,
  InboxNotificationReadAllResponseApi,
  InboxNotificationReadAllResult,
  InboxNotificationReadResult,
  InboxNotificationResourceItemApi,
  InboxNotificationShowResult,
  InboxNotificationSuccessResponseApi,
} from '@/types/inbox_notification';
import { keysToCamelCase } from '@/utils/case';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function inboxNotificationFromResource(resource: InboxNotificationResourceItemApi): InboxNotification {
  const attributes = keysToCamelCase<InboxNotificationAttributesApi>(resource.attributes);

  return {
    id: attributes.id ?? resource.id,
    kind: attributes.kind,
    title: attributes.title,
    body: attributes.body || null,
    read: Boolean(attributes.read),
    readAt: attributes.readAt || null,
    notifiableType: attributes.notifiableType || null,
    notifiableId: attributes.notifiableId == null || attributes.notifiableId === '' ? null : String(attributes.notifiableId),
    data: isRecord(attributes.data) ? attributes.data : {},
    createdAt: attributes.createdAt,
  };
}

export function inboxNotificationCollectionFromApi(response: InboxNotificationCollectionResponseApi): InboxNotificationListResult {
  const notifications = response.data.map(inboxNotificationFromResource);
  const meta = keysToCamelCase<{
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
    unreadCount: number;
  }>(response.meta);

  return {
    notifications,
    pagination: {
      limit: meta.limit,
      nextCursor: meta.nextCursor || null,
      hasMore: Boolean(meta.hasMore),
      unreadCount: meta.unreadCount ?? 0,
    },
  };
}

export function inboxNotificationShowFromApi(response: InboxNotificationSuccessResponseApi): InboxNotificationShowResult {
  return inboxNotificationFromResource(response.data);
}

export function inboxNotificationReadFromApi(response: InboxNotificationSuccessResponseApi): InboxNotificationReadResult {
  return {
    message: response.message ?? '',
    notification: inboxNotificationFromResource(response.data),
  };
}

export function inboxNotificationReadAllFromApi(response: InboxNotificationReadAllResponseApi): InboxNotificationReadAllResult {
  return {
    message: response.message,
    count: response.meta.count,
  };
}

export function inboxNotificationBroadcastFromApi(payload: unknown): InboxNotificationBroadcast {
  const raw = keysToCamelCase<{
    userId?: string;
    kind?: string;
    unreadCount?: number;
    notification?: InboxNotificationResourceItemApi;
  }>(payload);

  return {
    userId: raw.userId,
    kind: raw.kind ?? '',
    unreadCount: Number(raw.unreadCount ?? 0),
    notification: raw.notification ? inboxNotificationFromResource(raw.notification) : undefined,
  };
}
