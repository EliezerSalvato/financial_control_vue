import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { useNotificationStore } from '@/stores/notification';
import { notifyApiError } from '@/utils/notifyApiError';

describe('notifyApiError', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('usa a mensagem de base da API quando existe', () => {
    notifyApiError(
      new ApiError(422, {
        status: 'error',
        message: 'inválido',
        details: { base: ['já existe'] },
      }),
    );

    expect(useNotificationStore().currentMessage).toBe('já existe');
    expect(useNotificationStore().currentMessageType).toBe('danger');
  });

  it('cai para a mensagem do ApiError quando não há base', () => {
    notifyApiError(
      new ApiError(500, {
        status: 'error',
        message: 'falhou',
        details: {},
      }),
    );

    expect(useNotificationStore().currentMessage).toBe('falhou');
  });

  it('usa a mensagem genérica para erros desconhecidos', () => {
    notifyApiError(new Error('offline'));

    expect(useNotificationStore().currentMessage).toBe('Something went wrong. Please try again.');
    expect(useNotificationStore().currentMessageType).toBe('danger');
  });
});
