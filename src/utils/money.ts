import type { AppLocale } from '@/locales/locale';
import { DEFAULT_LOCALE, getCurrencyCode, isAppLocale } from '@/locales/locale';

function resolveLocale(locale: string): AppLocale {
  return isAppLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function formatCurrency(value: number, locale: string): string {
  const appLocale = resolveLocale(locale);

  return new Intl.NumberFormat(appLocale, {
    style: 'currency',
    currency: getCurrencyCode(appLocale),
  }).format(value);
}

export function signedAmountClass(value: number): string | undefined {
  if (value > 0) return 'has-text-success';

  if (value < 0) return 'has-text-danger';

  return undefined;
}
