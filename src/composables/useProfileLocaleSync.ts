import type { AppLocale } from '@/locales/locale';
import { storeToRefs } from 'pinia';
import { ApiError } from '@/api/client';
import { updateProfile } from '@/api/user';
import { applyDocumentLocale, resolveLocale, setLocaleCookie } from '@/locales/locale';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { useUserStore } from '@/stores/user';
import { watch } from 'vue';
import i18n from '@/locales';

export function applyAppLocale(next: AppLocale) {
  i18n.global.locale.value = next;
  setLocaleCookie(next);
  applyDocumentLocale(next);
}

export async function syncProfileLocale(locale: AppLocale) {
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const notificationStore = useNotificationStore();
  const user = userStore.user;

  if (!authStore.token || !user) return;

  if (user.configs?.locale === locale) return;

  try {
    await updateProfile({ configs: { locale } });

    if (userStore.user) {
      userStore.setUser({
        ...userStore.user,
        configs: { ...userStore.user.configs, locale },
      });
    }
  } catch (error) {
    const message = error instanceof ApiError ? error.message : i18n.global.t('utils.errorsHandler.somethingWentWrong');

    notificationStore.setCurrentMessage(message, 'danger');
  }
}

export function useProfileLocaleSync() {
  const authStore = useAuthStore();
  const userStore = useUserStore();
  const { token } = storeToRefs(authStore);
  const { user } = storeToRefs(userStore);

  watch(
    [token, () => user.value?.configs?.locale],
    () => {
      const preferred = token.value && user.value ? user.value.configs?.locale : undefined;

      applyAppLocale(resolveLocale(preferred));
    },
    { immediate: true },
  );
}
