import type { User } from '@/types/user';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshSession } from '@/api/auth';
import { ApiError, apiRequest } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';

const routerMocks = vi.hoisted(() => ({
  currentRouteName: 'tags' as string | undefined,
  push: vi.fn<(...args: unknown[]) => void>(),
}));

vi.mock('@/api/auth', () => ({
  refreshSession: vi.fn<() => void>(),
  revokeSessions: vi.fn<() => void>(),
}));

vi.mock('@/router', () => ({
  default: {
    currentRoute: {
      get value() {
        return { name: routerMocks.currentRouteName };
      },
    },
    push: (...args: unknown[]) => routerMocks.push(...args),
  },
}));

const user: User = {
  id: 'user-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  fullName: 'Ada Lovelace',
  configs: {},
};

function jsonResponse(status: number, body: unknown, failJson = false): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (failJson) throw new Error('no json');

      return body;
    },
  } as Response;
}

describe('apiRequest', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routerMocks.currentRouteName = 'tags';
    routerMocks.push.mockReset();
    vi.mocked(refreshSession).mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envia Bearer e credentials quando há token', async () => {
    useAuthStore().setToken('token-1');

    await apiRequest('/api/v1/tags');

    expect(fetch).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL}/api/v1/tags`,
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-1',
        }),
      }),
    );
  });

  it('omite Authorization quando não há token', async () => {
    await apiRequest('/api/v1/tags');

    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('lança ApiError com detalhes da API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(422, {
        status: 'error',
        message: 'inválido',
        details: { name: ['já existe'] },
      }),
    );

    await expect(apiRequest('/api/v1/tags')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'inválido',
      details: { name: ['já existe'] },
    });
  });

  it('usa mensagem padrão quando o corpo não é JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, null, true));

    await expect(apiRequest('/api/v1/tags')).rejects.toMatchObject({
      status: 500,
      message: 'Something went wrong. Please try again.',
      details: {},
    });
  });

  it('renova o token uma vez e retenta o pedido após 401', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { message: 'expired' }))
      .mockResolvedValueOnce(jsonResponse(200, { tags: [] }));
    vi.mocked(refreshSession).mockResolvedValue({
      status: 'success',
      type: 'object',
      data: { token: 'new-token', user },
    });
    useAuthStore().setToken('old-token');
    useAuthStore().setRememberMe(true);

    await expect(apiRequest('/api/v1/tags')).resolves.toEqual({ tags: [] });

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(refreshSession).toHaveBeenCalledWith({ rememberMe: true });
    expect(useAuthStore().token).toBe('new-token');
    expect(useUserStore().user).toEqual(user);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer new-token' }),
      }),
    );
  });

  it('compartilha o refresh entre pedidos 401 simultâneos', async () => {
    let resolveRefresh: ((value: Awaited<ReturnType<typeof refreshSession>>) => void) | undefined;
    vi.mocked(refreshSession).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const fetchByPath = new Map<string, number>();
    vi.mocked(fetch).mockImplementation(async (input) => {
      const path = String(input);
      const count = (fetchByPath.get(path) ?? 0) + 1;
      fetchByPath.set(path, count);

      if (count === 1) {
        return jsonResponse(401, { message: 'expired' });
      }

      return jsonResponse(200, { ok: true });
    });
    useAuthStore().setToken('old-token');

    const pending = Promise.all([apiRequest('/api/v1/tags'), apiRequest('/api/v1/accounts')]);
    await vi.waitFor(() => expect(refreshSession).toHaveBeenCalledTimes(1));

    resolveRefresh?.({
      status: 'success',
      type: 'object',
      data: { token: 'new-token', user },
    });
    await pending;

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('não tenta refresh quando skipAuthRetry está ativo', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: 'expired' }));

    await expect(apiRequest('/api/v1/tags', { skipAuthRetry: true })).rejects.toBeInstanceOf(ApiError);
    expect(refreshSession).not.toHaveBeenCalled();
    expect(routerMocks.push).not.toHaveBeenCalled();
  });

  it('limpa a sessão e redireciona quando o refresh falha', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: 'expired' }));
    vi.mocked(refreshSession).mockRejectedValue(new Error('refresh failed'));
    useAuthStore().setToken('old-token');

    await expect(apiRequest('/api/v1/tags')).rejects.toBeInstanceOf(ApiError);

    expect(useAuthStore().token).toBeNull();
    expect(routerMocks.push).toHaveBeenCalledWith({ name: 'signIn' });
  });

  it('não redireciona para o login se já está na tela de entrada', async () => {
    routerMocks.currentRouteName = 'signIn';
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: 'expired' }));
    vi.mocked(refreshSession).mockRejectedValue(new Error('refresh failed'));

    await expect(apiRequest('/api/v1/tags')).rejects.toBeInstanceOf(ApiError);
    expect(routerMocks.push).not.toHaveBeenCalled();
  });
});
