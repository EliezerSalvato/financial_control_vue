import { getCookie, setCookie } from '@/utils/cookies';

export const SUPPORTED_LOCALES = ['pt-BR', 'en'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';
export const LOCALE_COOKIE_NAME = 'locale';
export const LOCALE_COOKIE_EXPIRES = 'Fri, 31 Dec 9999 23:59:59 GMT';

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function resolveLocale(userLocale?: string | null): AppLocale {
  if (isAppLocale(userLocale)) return userLocale;

  const cookieValue = getCookie(LOCALE_COOKIE_NAME);
  if (isAppLocale(cookieValue)) return cookieValue;

  return DEFAULT_LOCALE;
}

export function getLocaleFromCookie(): AppLocale {
  return resolveLocale();
}

export function setLocaleCookie(locale: AppLocale): void {
  setCookie(LOCALE_COOKIE_NAME, locale, LOCALE_COOKIE_EXPIRES);
}

export function ensureLocaleCookie(locale: AppLocale = getLocaleFromCookie()): AppLocale {
  setLocaleCookie(locale);

  return locale;
}

export function applyDocumentLocale(locale: AppLocale): void {
  document.documentElement.lang = locale;
}

export const FRONT_MONTH_YEAR_FORMAT = 'MM/YYYY';

export function getFrontDateFormat(locale: AppLocale): string {
  return locale === 'pt-BR' ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
}

export function formatFrontMonthYear(iso: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  const year = match?.[1];
  const month = match?.[2];

  if (!year || !month) return iso;

  return `${month}/${year}`;
}

export function formatFrontDate(iso: string, locale: AppLocale): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const year = match?.[1];
  const month = match?.[2];
  const day = match?.[3];

  if (!year || !month || !day) return iso;

  return getFrontDateFormat(locale).replace('YYYY', year).replace('MM', month).replace('DD', day);
}

export function getCalendarLang(locale: AppLocale): string {
  return locale === 'pt-BR' ? 'pt' : 'en';
}

export function getCurrencyCode(locale: AppLocale): string {
  return locale === 'pt-BR' ? 'BRL' : 'USD';
}

export function getCurrencySymbol(locale: AppLocale): string {
  return locale === 'pt-BR' ? 'R$' : '$';
}

export function getTimeZone(locale: AppLocale): string {
  return locale === 'pt-BR' ? 'America/Sao_Paulo' : 'America/New_York';
}

export function getZonedDateParts(date: Date, locale: AppLocale): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: getTimeZone(locale),
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const valueOf = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);

  return {
    year: valueOf('year'),
    month: valueOf('month'),
    day: valueOf('day'),
  };
}

export function getTodayIsoDate(locale: AppLocale, date = new Date()): string {
  const { year, month, day } = getZonedDateParts(date, locale);

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatFrontDateTime(iso: string, locale: AppLocale): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: getTimeZone(locale),
  }).format(date);
}
