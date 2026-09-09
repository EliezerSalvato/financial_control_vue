import type { JsonApiCollectionResponse, JsonApiObjectResponse, JsonApiResource, MessageSuccessResponseApi, MutationResult } from '@/types/api';

export const TRANSACTION_NOTIFIABLE_TYPE = 'Transaction::Record';

export type InboxNotification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read: boolean;
  readAt: string | null;
  notifiableType: string | null;
  notifiableId: string | null;
  data: Record<string, unknown>;
  createdAt: string;
};

export type InboxNotificationAttributesApi = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read: boolean;
  readAt: string | null;
  notifiableType: string | null;
  notifiableId: string | number | null;
  data?: Record<string, unknown> | null;
  createdAt: string;
};

export type InboxNotificationResourceItemApi = JsonApiResource<'notification', InboxNotificationAttributesApi>;

export type InboxNotificationCursorMetaApi = {
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
  unread_count: number;
};

export type InboxNotificationCollectionResponseApi = JsonApiCollectionResponse<InboxNotificationResourceItemApi, InboxNotificationCursorMetaApi>;

export type InboxNotificationSuccessResponseApi = JsonApiObjectResponse<InboxNotificationResourceItemApi>;

export type InboxNotificationReadAllResponseApi = MessageSuccessResponseApi & {
  meta: {
    count: number;
  };
};

export type InboxNotificationCursorPagination = {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
};

export type InboxNotificationListParams = {
  after?: string;
  limit?: number;
  unread?: boolean;
};

export type InboxNotificationListResult = {
  notifications: InboxNotification[];
  pagination: InboxNotificationCursorPagination;
};

export type InboxNotificationShowResult = InboxNotification;

export type InboxNotificationReadResult = MutationResult<'notification', InboxNotification>;

export type InboxNotificationReadAllResult = {
  message: string;
  count: number;
};

export type InboxNotificationBroadcast = {
  userId?: string;
  kind: string;
  unreadCount: number;
  notification?: InboxNotification;
};

export type InboxFeedEvent =
  | { type: 'reload' }
  | { type: 'prepend'; notification: InboxNotification }
  | { type: 'read'; notification: InboxNotification }
  | { type: 'readAll' };
