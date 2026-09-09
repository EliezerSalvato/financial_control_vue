import type { InboxNotification } from '@/types/inbox_notification';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listNotifications, readAllNotifications, readNotification } from '@/api/notifications';
import { PREVIEW_LIMIT, useInboxNotificationsStore } from '@/stores/inboxNotifications';
import { useUserStore } from '@/stores/user';

vi.mock('@/api/notifications', () => ({
  listNotifications: vi.fn<() => void>(),
  readNotification: vi.fn<() => void>(),
  readAllNotifications: vi.fn<() => void>(),
}));

function notification(overrides: Partial<InboxNotification> = {}): InboxNotification {
  return {
    id: 'n-1',
    kind: 'transaction.created',
    title: 'Nova transação',
    body: 'Aluguel',
    read: false,
    readAt: null,
    notifiableType: 'Transaction::Record',
    notifiableId: '42',
    data: {},
    createdAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

function listResult(items: InboxNotification[], extras: Record<string, unknown> = {}) {
  return {
    notifications: items,
    pagination: {
      limit: PREVIEW_LIMIT,
      nextCursor: null as string | null,
      hasMore: false,
      unreadCount: items.filter((item) => !item.read).length,
      ...extras,
    },
  };
}

describe('useInboxNotificationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(listNotifications).mockReset();
    vi.mocked(readNotification).mockReset();
    vi.mocked(readAllNotifications).mockReset();
  });

  it('carrega o preview e ignora a resposta mais antiga em voo', async () => {
    const store = useInboxNotificationsStore();
    const first = notification({ id: 'n-old' });
    const second = notification({ id: 'n-new' });
    let resolveFirst: ((value: ReturnType<typeof listResult>) => void) | undefined;

    vi.mocked(listNotifications)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(listResult([second], { unreadCount: 1 }));

    const pending = store.loadPreview();
    await store.loadPreview();

    expect(store.previewItems).toEqual([second]);
    expect(store.unreadCount).toBe(1);

    resolveFirst?.(listResult([first], { unreadCount: 9 }));
    await pending;

    expect(store.previewItems).toEqual([second]);
    expect(store.previewLoading).toBe(false);
  });

  it('pede só não lidas quando o filtro está ativo', async () => {
    vi.mocked(listNotifications).mockResolvedValue(listResult([]));
    const store = useInboxNotificationsStore();

    await store.loadPreview(true);

    expect(listNotifications).toHaveBeenCalledWith({
      limit: PREVIEW_LIMIT,
      after: undefined,
      unread: true,
    });
  });

  it('carrega mais itens sem duplicar e para quando todos já estavam na lista', async () => {
    const first = notification({ id: 'n-1' });
    const extra = notification({ id: 'n-2' });
    vi.mocked(listNotifications)
      .mockResolvedValueOnce(listResult([first], { hasMore: true, nextCursor: 'cursor-2', unreadCount: 2 }))
      .mockResolvedValueOnce(listResult([extra], { hasMore: true, nextCursor: 'cursor-3', unreadCount: 2 }))
      .mockResolvedValueOnce(listResult([extra], { hasMore: true, nextCursor: 'cursor-4', unreadCount: 2 }));

    const store = useInboxNotificationsStore();
    await store.loadPreview();
    await store.loadMorePreview();

    expect(store.previewItems.map((item) => item.id)).toEqual(['n-1', 'n-2']);
    expect(store.previewHasMore).toBe(true);

    await store.loadMorePreview();

    expect(store.previewItems).toHaveLength(2);
    expect(store.previewHasMore).toBe(false);
  });

  it('não pede mais itens quando não há cursor ou o preview ainda carrega', async () => {
    vi.mocked(listNotifications).mockResolvedValue(listResult([notification()], { hasMore: false }));
    const store = useInboxNotificationsStore();

    await store.loadPreview();
    await store.loadMorePreview();

    expect(listNotifications).toHaveBeenCalledTimes(1);
  });

  it('marca uma notificação como lida e decrementa o contador só na primeira leitura', async () => {
    const unread = notification();
    const read = notification({ read: true, readAt: '2026-09-02T00:00:00.000Z' });
    vi.mocked(listNotifications).mockResolvedValue(listResult([unread], { unreadCount: 3 }));
    vi.mocked(readNotification).mockResolvedValue({ message: 'ok', notification: read });

    const store = useInboxNotificationsStore();
    await store.loadPreview();
    await store.markAsRead('n-1', false);

    expect(store.unreadCount).toBe(2);
    expect(store.previewItems[0]?.read).toBe(true);
    expect(store.feedEvent).toEqual({ type: 'read', notification: read });

    await store.markAsRead('n-1', true);
    expect(store.unreadCount).toBe(2);
  });

  it('marca todas como lidas e esvazia o preview quando o filtro é só não lidas', async () => {
    const items = [notification({ id: 'n-1' }), notification({ id: 'n-2' })];
    vi.mocked(listNotifications).mockResolvedValue(listResult(items, { unreadCount: 2 }));
    vi.mocked(readAllNotifications).mockResolvedValue({ message: 'done', count: 2 });

    const store = useInboxNotificationsStore();
    await store.loadPreview(true);
    await store.markAllAsRead();

    expect(store.unreadCount).toBe(0);
    expect(store.previewItems).toEqual([]);
    expect(store.feedEvent).toEqual({ type: 'readAll' });
  });

  it('marca todas como lidas sem esvaziar quando o filtro não está ativo', async () => {
    const items = [notification({ id: 'n-1' }), notification({ id: 'n-2', read: true })];
    vi.mocked(listNotifications).mockResolvedValue(listResult(items, { unreadCount: 1 }));
    vi.mocked(readAllNotifications).mockResolvedValue({ message: 'done', count: 1 });

    const store = useInboxNotificationsStore();
    await store.loadPreview();
    await store.markAllAsRead();

    expect(store.previewItems.every((item) => item.read)).toBe(true);
  });

  it('ignora broadcast de outro usuário', () => {
    const store = useInboxNotificationsStore();
    const userStore = useUserStore();
    userStore.setUser({
      id: 'user-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
      configs: {},
    });
    store.setUnreadCount(4);

    store.applyBroadcast({
      userId: 'user-2',
      kind: '',
      unreadCount: 9,
      notification: notification(),
    });

    expect(store.unreadCount).toBe(4);
    expect(store.previewItems).toEqual([]);
  });

  it('insere o broadcast no topo e remove itens lidos quando o filtro é só não lidas', async () => {
    const existing = notification({ id: 'n-1' });
    vi.mocked(listNotifications).mockResolvedValue(listResult([existing], { unreadCount: 1 }));

    const store = useInboxNotificationsStore();
    await store.loadPreview(true);

    store.applyBroadcast({
      userId: 'user-1',
      kind: '',
      unreadCount: 2,
      notification: notification({ id: 'n-2' }),
    });

    expect(store.previewItems.map((item) => item.id)).toEqual(['n-2', 'n-1']);
    expect(store.feedEvent).toEqual({ type: 'prepend', notification: notification({ id: 'n-2' }) });

    store.applyBroadcast({
      kind: '',
      unreadCount: 1,
      notification: notification({ id: 'n-2', read: true }),
    });

    expect(store.previewItems.map((item) => item.id)).toEqual(['n-1']);
  });

  it('pede um reload quando o broadcast não traz notificação', async () => {
    vi.mocked(listNotifications).mockResolvedValue(listResult([notification()], { unreadCount: 1 }));
    const store = useInboxNotificationsStore();

    store.applyBroadcast({ kind: '', unreadCount: 1 });

    expect(store.feedEvent).toEqual({ type: 'reload' });
    await vi.waitFor(() => expect(listNotifications).toHaveBeenCalled());
  });

  it('zera o estado no reset', async () => {
    vi.mocked(listNotifications).mockResolvedValue(listResult([notification()], { unreadCount: 1, hasMore: true, nextCursor: 'c' }));
    const store = useInboxNotificationsStore();
    await store.loadPreview();

    store.reset();

    expect(store.unreadCount).toBe(0);
    expect(store.previewItems).toEqual([]);
    expect(store.previewHasMore).toBe(false);
    expect(store.feedEvent).toBeNull();
    expect(store.feedSeq).toBe(0);
  });
});
