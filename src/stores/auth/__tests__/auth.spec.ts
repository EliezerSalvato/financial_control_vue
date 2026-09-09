import type { User } from '@/types/user';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshSession, revokeSessions } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';

vi.mock('@/api/auth', () => ({
  refreshSession: vi.fn<() => void>(),
  revokeSessions: vi.fn<() => void>(),
}));

const user: User = {
  id: 'user-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  fullName: 'Ada Lovelace',
  configs: {},
};

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.mocked(refreshSession).mockReset();
    vi.mocked(revokeSessions).mockReset();
  });

  it('lê rememberMe do localStorage na criação', () => {
    localStorage.setItem('rememberMe', 'true');
    setActivePinia(createPinia());

    expect(useAuthStore().rememberMe).toBe(true);
  });

  it('persiste rememberMe e limpa a chave ao desligar', () => {
    const store = useAuthStore();

    store.setRememberMe(true);
    expect(localStorage.getItem('rememberMe')).toBe('true');

    store.setRememberMe(false);
    expect(localStorage.getItem('rememberMe')).toBeNull();
    expect(store.rememberMe).toBe(false);
  });

  it('considera autenticado só quando há token', () => {
    const store = useAuthStore();

    expect(store.isAuthenticated).toBe(false);

    store.setToken('token-1');
    expect(store.isAuthenticated).toBe(true);
  });

  it('atualiza token e usuário no refresh', async () => {
    vi.mocked(refreshSession).mockResolvedValue({
      status: 'success',
      type: 'object',
      data: { token: 'new-token', user },
    });

    const store = useAuthStore();
    store.setRememberMe(true);
    await store.refreshToken();

    expect(refreshSession).toHaveBeenCalledWith({ rememberMe: true });
    expect(store.token).toBe('new-token');
    expect(useUserStore().user).toEqual(user);
  });

  it('limpa sessão, rememberMe e usuário', () => {
    const store = useAuthStore();
    const userStore = useUserStore();

    store.setToken('token-1');
    store.setRememberMe(true);
    userStore.setUser(user);
    store.clearSession();

    expect(store.token).toBeNull();
    expect(store.rememberMe).toBe(false);
    expect(store.isAuthenticated).toBe(false);
    expect(userStore.user).toBeNull();
    expect(localStorage.getItem('rememberMe')).toBeNull();
  });

  it('limpa a sessão no logout mesmo se a revogação falhar', async () => {
    vi.mocked(revokeSessions).mockRejectedValue(new Error('offline'));
    const store = useAuthStore();
    store.setToken('token-1');

    await expect(store.logout()).rejects.toThrow('offline');
    expect(store.token).toBeNull();
  });

  it('revoga as sessões e limpa o estado no logout', async () => {
    vi.mocked(revokeSessions).mockResolvedValue({ status: 'success', message: 'ok' });
    const store = useAuthStore();
    store.setToken('token-1');

    await store.logout();

    expect(revokeSessions).toHaveBeenCalled();
    expect(store.token).toBeNull();
  });
});
