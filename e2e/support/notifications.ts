import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type NotificationRecord = {
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

export const defaultNotifications: NotificationRecord[] = [
  {
    id: '1',
    kind: 'invoice',
    title: 'Invoice due',
    body: 'Your invoice is ready.',
    read: false,
    readAt: null,
    notifiableType: null,
    notifiableId: null,
    data: {},
    createdAt: '2026-09-08T12:00:00.000Z',
  },
  {
    id: '2',
    kind: 'transaction',
    title: 'Transaction updated',
    body: 'Salary was updated.',
    read: false,
    readAt: null,
    notifiableType: 'Transaction::Record',
    notifiableId: '1',
    data: { amount: 50 },
    createdAt: '2026-09-08T11:00:00.000Z',
  },
  {
    id: '3',
    kind: 'welcome',
    title: 'Welcome',
    body: null,
    read: true,
    readAt: '2026-09-07T09:00:00.000Z',
    notifiableType: null,
    notifiableId: null,
    data: {},
    createdAt: '2026-09-07T09:00:00.000Z',
  },
];

export function manyNotifications(count: number): NotificationRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const n = index + 1;

    return {
      id: String(n),
      kind: 'info',
      title: `Notice ${String(n).padStart(2, '0')}`,
      body: null,
      read: false,
      readAt: null,
      notifiableType: null,
      notifiableId: null,
      data: {},
      createdAt: `2026-09-08T12:${String(n).padStart(2, '0')}:00.000Z`,
    };
  });
}

export function notificationResource(notification: NotificationRecord) {
  return {
    id: notification.id,
    type: 'notification' as const,
    attributes: {
      id: notification.id,
      kind: notification.kind,
      title: notification.title,
      body: notification.body,
      read: notification.read,
      readAt: notification.readAt,
      notifiableType: notification.notifiableType,
      notifiableId: notification.notifiableId,
      data: notification.data,
      createdAt: notification.createdAt,
    },
  };
}

export class NotificationsApi {
  notifications: NotificationRecord[];
  defaultLimit: number;

  constructor(notifications: NotificationRecord[] = defaultNotifications, defaultLimit = 10) {
    this.notifications = notifications.map((notification) => ({ ...notification, data: { ...notification.data } }));
    this.defaultLimit = defaultLimit;
  }

  find(id: string) {
    return this.notifications.find((notification) => notification.id === id);
  }

  unreadCount() {
    return this.notifications.filter((notification) => !notification.read).length;
  }

  handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url).replace(/\/$/, '');

    if (path === '/api/v1/notifications' && method === 'GET') {
      return this.list(route, apiSearch(url));
    }

    if (path === '/api/v1/notifications/read_all' && method === 'POST') {
      return this.readAll(route);
    }

    const readId = path.match(/\/api\/v1\/notifications\/([^/]+)\/read$/)?.[1];

    if (readId && method === 'POST') {
      return this.read(route, readId);
    }

    const id = path.match(/\/api\/v1\/notifications\/([^/]+)$/)?.[1];

    if (id && method === 'GET') {
      return this.show(route, id);
    }

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }

  private sorted() {
    return [...this.notifications].sort((left, right) => {
      if (left.createdAt !== right.createdAt) {
        return left.createdAt < right.createdAt ? 1 : -1;
      }

      return right.id.localeCompare(left.id);
    });
  }

  private list(route: Route, search: URLSearchParams) {
    const unread = search.get('unread') === 'true';
    const limit = Number(search.get('limit') ?? this.defaultLimit);
    const after = search.get('after');
    let items = this.sorted();

    if (unread) {
      items = items.filter((notification) => !notification.read);
    }

    if (after) {
      const index = items.findIndex((notification) => notification.id === after);
      items = index === -1 ? [] : items.slice(index + 1);
    }

    const pageItems = items.slice(0, limit);
    const hasMore = items.length > limit;

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: pageItems.map(notificationResource),
      meta: {
        limit,
        next_cursor: hasMore ? (pageItems[pageItems.length - 1]?.id ?? null) : null,
        has_more: hasMore,
        unread_count: this.unreadCount(),
      },
    });
  }

  private show(route: Route, id: string) {
    const notification = this.find(id);

    if (!notification) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      data: notificationResource(notification),
    });
  }

  private read(route: Route, id: string) {
    const notification = this.find(id);

    if (!notification) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    notification.read = true;
    notification.readAt = notification.readAt ?? '2026-09-08T15:00:00.000Z';

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Notification was marked as read.',
      data: notificationResource(notification),
    });
  }

  private readAll(route: Route) {
    const count = this.unreadCount();

    this.notifications = this.notifications.map((notification) =>
      notification.read ? notification : { ...notification, read: true, readAt: notification.readAt ?? '2026-09-08T15:00:00.000Z' },
    );

    return fulfillJson(route, {
      status: 'success',
      message: 'Notifications were marked as read.',
      meta: { count },
    });
  }
}

export async function mockNotificationsApi(page: Page, notifications = new NotificationsApi()) {
  await page.route(/\/api\/v1\/notifications(\/|\?|$)/, (route) => notifications.handle(route));

  return notifications;
}
