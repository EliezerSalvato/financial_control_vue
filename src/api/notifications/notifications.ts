import type {
  InboxNotificationBroadcast,
  InboxNotificationCollectionResponseApi,
  InboxNotificationListParams,
  InboxNotificationListResult,
  InboxNotificationReadAllResponseApi,
  InboxNotificationReadAllResult,
  InboxNotificationReadResult,
  InboxNotificationShowResult,
  InboxNotificationSuccessResponseApi,
} from '@/types/inbox_notification';
import { subscribeToChannel } from '@/api/cable';
import { apiRequest } from '@/api/client';
import {
  inboxNotificationBroadcastFromApi,
  inboxNotificationCollectionFromApi,
  inboxNotificationReadAllFromApi,
  inboxNotificationReadFromApi,
  inboxNotificationShowFromApi,
} from '@/transformers/inbox_notification';

function buildListPath(params: InboxNotificationListParams = {}): string {
  const search = new URLSearchParams();

  if (params.after) {
    search.set('after', params.after);
  }

  if (params.limit != null) {
    search.set('limit', String(params.limit));
  }

  if (params.unread) {
    search.set('unread', 'true');
  }

  const query = search.toString();

  return query ? `/api/v1/notifications?${query}` : '/api/v1/notifications';
}

export async function listNotifications(params: InboxNotificationListParams = {}): Promise<InboxNotificationListResult> {
  const response = await apiRequest<InboxNotificationCollectionResponseApi>(buildListPath(params));

  return inboxNotificationCollectionFromApi(response);
}

export async function getNotification(id: string | number): Promise<InboxNotificationShowResult> {
  const response = await apiRequest<InboxNotificationSuccessResponseApi>(`/api/v1/notifications/${id}`);

  return inboxNotificationShowFromApi(response);
}

export async function readNotification(id: string | number): Promise<InboxNotificationReadResult> {
  const response = await apiRequest<InboxNotificationSuccessResponseApi>(`/api/v1/notifications/${id}/read`, {
    method: 'POST',
  });

  return inboxNotificationReadFromApi(response);
}

export async function readAllNotifications(): Promise<InboxNotificationReadAllResult> {
  const response = await apiRequest<InboxNotificationReadAllResponseApi>('/api/v1/notifications/read_all', {
    method: 'POST',
  });

  return inboxNotificationReadAllFromApi(response);
}

export function subscribeInboxNotifications(onMessage: (update: InboxNotificationBroadcast) => void): () => void {
  return subscribeToChannel({
    channel: 'NotificationChannel',
    onMessage: (message) => {
      onMessage(inboxNotificationBroadcastFromApi(message));
    },
  });
}
