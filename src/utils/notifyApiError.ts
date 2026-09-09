import { ApiError } from '@/api/client';
import { useNotificationStore } from '@/stores/notification';
import i18n from '@/locales';

export function notifyApiError(error: unknown) {
  const notificationStore = useNotificationStore();

  if (error instanceof ApiError) {
    notificationStore.setCurrentMessage(error.details.base?.[0] ?? error.message, 'danger');
    return;
  }

  notificationStore.setCurrentMessage(i18n.global.t('utils.errorsHandler.somethingWentWrong'), 'danger');
}
