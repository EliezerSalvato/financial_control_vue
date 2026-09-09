import type { User } from '@/types/user';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshSession } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { useUserStore } from '@/stores/user';
import router from '@/router';

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

describe('router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.mocked(refreshSession).mockReset();
    vi.mocked(refreshSession).mockRejectedValue(new Error('no session'));
  });

  it('limpa a notificação em qualquer navegação', async () => {
    useNotificationStore().setCurrentMessage('aviso', 'success');

    await router.push({ name: 'confirmEmail' });

    expect(useNotificationStore().currentMessage).toBe('');
  });

  it('redireciona rota autenticada para o login com o path original', async () => {
    await router.push('/tags');

    expect(router.currentRoute.value.name).toBe('signIn');
    expect(router.currentRoute.value.query.redirect).toBe('/tags');
  });

  it('restaura a sessão e libera a rota protegida', async () => {
    vi.mocked(refreshSession).mockResolvedValue({
      status: 'success',
      type: 'object',
      data: { token: 'restored', user },
    });

    await router.push('/tags');

    expect(useAuthStore().token).toBe('restored');
    expect(useUserStore().user).toEqual(user);
    expect(router.currentRoute.value.name).toBe('tags');
  });

  it('não tenta restaurar a sessão quando já há token', async () => {
    useAuthStore().setToken('token-1');

    await router.push('/tags');

    expect(refreshSession).not.toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe('tags');
  });

  it('manda usuário autenticado embora das rotas de visitante', async () => {
    useAuthStore().setToken('token-1');

    await router.push({ name: 'signIn' });

    expect(router.currentRoute.value.name).toBe('monthly_statement');
  });

  it('abre a página 404 para rotas desconhecidas', async () => {
    await router.push('/rota-inexistente');

    expect(router.currentRoute.value.name).toBe('notFound');
  });

  it('restaura a sessão na página 404 sem redirecionar', async () => {
    vi.mocked(refreshSession).mockResolvedValue({
      status: 'success',
      type: 'object',
      data: { token: 'restored', user },
    });

    await router.push('/outra-rota-inexistente');

    expect(useAuthStore().token).toBe('restored');
    expect(router.currentRoute.value.name).toBe('notFound');
  });
});
