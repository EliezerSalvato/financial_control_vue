import { afterEach, describe, expect, it } from 'vitest';
import {
  applyDocumentLocale,
  ensureLocaleCookie,
  formatFrontDate,
  formatFrontDateTime,
  formatFrontMonthYear,
  getCalendarLang,
  getCurrencyCode,
  getCurrencySymbol,
  getFrontDateFormat,
  getTimeZone,
  getTodayIsoDate,
  isAppLocale,
  resolveLocale,
} from '@/locales/locale';

describe('isAppLocale', () => {
  it('aceita apenas os locales suportados', () => {
    expect(isAppLocale('en')).toBe(true);
    expect(isAppLocale('pt-BR')).toBe(true);
    expect(isAppLocale('es')).toBe(false);
    expect(isAppLocale(null)).toBe(false);
  });
});

describe('resolveLocale', () => {
  afterEach(() => {
    document.cookie = 'locale=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('prioriza o locale do usuário e cai para o cookie ou inglês', () => {
    expect(resolveLocale('pt-BR')).toBe('pt-BR');
    expect(resolveLocale('fr')).toBe('en');

    document.cookie = 'locale=pt-BR; path=/';
    expect(resolveLocale()).toBe('pt-BR');

    document.cookie = 'locale=es; path=/';
    expect(resolveLocale()).toBe('en');
  });
});

describe('formatFrontDate', () => {
  it('formata ISO conforme o locale', () => {
    expect(formatFrontDate('2026-03-15', 'en')).toBe('03/15/2026');
    expect(formatFrontDate('2026-03-15', 'pt-BR')).toBe('15/03/2026');
    expect(formatFrontDate('invalid', 'en')).toBe('invalid');
  });
});

describe('formatFrontMonthYear', () => {
  it('formata só mês e ano como MM/YYYY', () => {
    expect(formatFrontMonthYear('2026-07-01')).toBe('07/2026');
    expect(formatFrontMonthYear('2026-07-31')).toBe('07/2026');
    expect(formatFrontMonthYear('invalid')).toBe('invalid');
  });
});

describe('getTodayIsoDate', () => {
  it('respeita o fuso do locale em volta da meia-noite UTC', () => {
    const aroundMidnightUtc = new Date('2026-09-09T03:00:00.000Z');

    expect(getTodayIsoDate('pt-BR', aroundMidnightUtc)).toBe('2026-09-09');
    expect(getTodayIsoDate('en', aroundMidnightUtc)).toBe('2026-09-08');
  });
});

describe('currency helpers', () => {
  it('retorna código e símbolo por locale', () => {
    expect(getCurrencyCode('pt-BR')).toBe('BRL');
    expect(getCurrencySymbol('pt-BR')).toBe('R$');
    expect(getCurrencyCode('en')).toBe('USD');
    expect(getCurrencySymbol('en')).toBe('$');
  });
});

describe('date / timezone helpers', () => {
  it('devolve formato, idioma do calendário e fuso', () => {
    expect(getFrontDateFormat('pt-BR')).toBe('DD/MM/YYYY');
    expect(getFrontDateFormat('en')).toBe('MM/DD/YYYY');
    expect(getCalendarLang('pt-BR')).toBe('pt');
    expect(getCalendarLang('en')).toBe('en');
    expect(getTimeZone('pt-BR')).toBe('America/Sao_Paulo');
    expect(getTimeZone('en')).toBe('America/New_York');
  });
});

describe('formatFrontDateTime', () => {
  it('formata data e hora no fuso do locale e devolve o original se for inválido', () => {
    const iso = '2026-03-15T15:00:00.000Z';
    const en = formatFrontDateTime(iso, 'en');
    const pt = formatFrontDateTime(iso, 'pt-BR');

    expect(formatFrontDateTime('not-a-date', 'en')).toBe('not-a-date');
    expect(en).not.toBe(iso);
    expect(pt).not.toBe(iso);
    expect(en).not.toBe(pt);
  });
});

describe('applyDocumentLocale / ensureLocaleCookie', () => {
  afterEach(() => {
    document.cookie = 'locale=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.documentElement.lang = '';
  });

  it('grava o cookie e o lang do documento', () => {
    expect(ensureLocaleCookie('pt-BR')).toBe('pt-BR');
    expect(document.cookie).toContain('locale=pt-BR');

    applyDocumentLocale('pt-BR');
    expect(document.documentElement.lang).toBe('pt-BR');
  });
});
