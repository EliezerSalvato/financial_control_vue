import type { InboxNotificationResourceItemApi } from '@/types/inbox_notification';
import { describe, expect, it } from 'vitest';
import {
  inboxNotificationBroadcastFromApi,
  inboxNotificationCollectionFromApi,
  inboxNotificationFromResource,
  inboxNotificationReadAllFromApi,
  inboxNotificationReadFromApi,
} from '@/transformers/inbox_notification';

const resource: InboxNotificationResourceItemApi = {
  id: 'n-1',
  type: 'notification',
  attributes: {
    id: 'n-1',
    kind: 'transaction.created',
    title: 'Nova transação',
    body: 'Aluguel',
    read: false,
    readAt: null,
    notifiableType: 'Transaction::Record',
    notifiableId: 42,
    data: { amount: 10 },
    createdAt: '2026-09-01T12:00:00.000Z',
  },
};

describe('inboxNotificationFromResource', () => {
  it('normaliza id numérico, body vazio e data ausente', () => {
    expect(inboxNotificationFromResource(resource)).toMatchObject({
      id: 'n-1',
      notifiableId: '42',
      body: 'Aluguel',
      data: { amount: 10 },
      read: false,
    });

    expect(
      inboxNotificationFromResource({
        ...resource,
        attributes: {
          ...resource.attributes,
          body: '',
          notifiableId: '',
          data: null,
          read: true,
          readAt: '2026-09-02T00:00:00.000Z',
        },
      }),
    ).toMatchObject({
      body: null,
      notifiableId: null,
      data: {},
      read: true,
      readAt: '2026-09-02T00:00:00.000Z',
    });
  });
});

describe('inboxNotificationCollectionFromApi', () => {
  it('converte meta em cursor camelCase', () => {
    expect(
      inboxNotificationCollectionFromApi({
        status: 'success',
        type: 'collection',
        data: [resource],
        meta: {
          limit: 20,
          next_cursor: 'cursor-2',
          has_more: true,
          unread_count: 4,
        },
      }),
    ).toEqual({
      notifications: [inboxNotificationFromResource(resource)],
      pagination: {
        limit: 20,
        nextCursor: 'cursor-2',
        hasMore: true,
        unreadCount: 4,
      },
    });
  });
});

describe('inboxNotification mutations / broadcast', () => {
  it('mapeia leitura, leitura em lote e payload do canal', () => {
    expect(
      inboxNotificationReadFromApi({
        status: 'success',
        type: 'object',
        message: 'ok',
        data: resource,
      }),
    ).toEqual({
      message: 'ok',
      notification: inboxNotificationFromResource(resource),
    });

    expect(inboxNotificationReadAllFromApi({ status: 'success', message: 'done', meta: { count: 3 } })).toEqual({
      message: 'done',
      count: 3,
    });

    expect(
      inboxNotificationBroadcastFromApi({
        user_id: 'user-1',
        unread_count: '7',
        notification: resource,
      }),
    ).toEqual({
      userId: 'user-1',
      kind: '',
      unreadCount: 7,
      notification: inboxNotificationFromResource(resource),
    });
  });
});
