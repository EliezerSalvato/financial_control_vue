import type { ApiErrorBody } from '@/types/api';
import type { AppLocale } from '@/locales/locale';
import { DEFAULT_LOCALE, ensureLocaleCookie, isAppLocale } from '@/locales/locale';
import i18n from '@/locales';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function currentLocale(): AppLocale {
  const value = i18n.global.locale.value;

  return isAppLocale(value) ? value : DEFAULT_LOCALE;
}

export class ApiError extends Error {
  status: number;
  details: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.details = body.details ?? {};
  }
}

type ApiRequestOptions = RequestInit & {
  skipAuthRetry?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;

function isUnauthorizedError(status: number) {
  return status === 401;
}

async function clearSessionAndRedirect() {
  const { useAuthStore } = await import('@/stores/auth');
  const router = (await import('@/router')).default;

  useAuthStore().clearSession();

  if (router.currentRoute.value.name !== 'signIn') {
    await router.push({ name: 'signIn' });
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { refreshSession } = await import('@/api/auth');
        const { useAuthStore } = await import('@/stores/auth');
        const { useUserStore } = await import('@/stores/user');
        const authStore = useAuthStore();
        const response = await refreshSession({ rememberMe: authStore.rememberMe });
        authStore.setToken(response.data.token);
        useUserStore().setUser(response.data.user);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipAuthRetry = false, ...fetchOptions } = options;
  const { useAuthStore } = await import('@/stores/auth');
  const token = useAuthStore().token;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  ensureLocaleCookie(currentLocale());

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (!skipAuthRetry && isUnauthorizedError(response.status)) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        return apiRequest<T>(path, { ...options, skipAuthRetry: true });
      }

      await clearSessionAndRedirect();
    }

    const errorBody: ApiErrorBody = {
      status: 'error',
      message: data?.message ?? i18n.global.t('utils.errorsHandler.somethingWentWrong'),
      details: data?.details ?? {},
    };

    throw new ApiError(response.status, errorBody);
  }

  return data as T;
}
