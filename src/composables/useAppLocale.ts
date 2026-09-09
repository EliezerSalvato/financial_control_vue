import type { AppLocale } from '@/locales/locale';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { DEFAULT_LOCALE, formatFrontDate, isAppLocale } from '@/locales/locale';

export function useAppLocale() {
  const { locale } = useI18n();
  const appLocale = computed<AppLocale>(() => (isAppLocale(locale.value) ? locale.value : DEFAULT_LOCALE));

  function formatDateLocal(iso: string): string {
    return formatFrontDate(iso, appLocale.value);
  }

  return { appLocale, formatDateLocal };
}
