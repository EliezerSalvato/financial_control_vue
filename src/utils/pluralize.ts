import { type AppLocale, getLocaleFromCookie } from '@/locales/locale';

function pluralizeEn(word: string): string {
  if (/[^aeiou]y$/i.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }

  if (/(?:s|x|z|ch|sh)$/i.test(word)) {
    return `${word}es`;
  }

  return `${word}s`;
}

function pluralizePtBr(word: string): string {
  // Compound nouns: "cartão de crédito" → "cartões de crédito"
  const deCompound = word.match(/^(.+?)\s+de\s+(.+)$/i);
  if (deCompound && deCompound[1] && deCompound[2]) {
    return `${pluralizePtBr(deCompound[1])} de ${deCompound[2]}`;
  }

  if (/ão$/i.test(word)) {
    return word.replace(/ão$/i, 'ões');
  }

  if (/m$/i.test(word)) {
    return `${word.slice(0, -1)}ns`;
  }

  if (/al$/i.test(word)) {
    return word.replace(/al$/i, 'ais');
  }

  if (/el$/i.test(word)) {
    return word.replace(/el$/i, 'éis');
  }

  if (/ol$/i.test(word)) {
    return word.replace(/ol$/i, 'óis');
  }

  if (/ul$/i.test(word)) {
    return word.replace(/ul$/i, 'uis');
  }

  if (/il$/i.test(word)) {
    return word.replace(/il$/i, 'is');
  }

  if (/[rz]$/i.test(word)) {
    return `${word}es`;
  }

  if (/[aeiouáéíóúâêô]$/i.test(word)) {
    return `${word}s`;
  }

  return `${word}s`;
}

export function pluralize(word: string, locale?: AppLocale): string {
  const resolvedLocale = locale ?? getLocaleFromCookie();

  if (resolvedLocale === 'pt-BR') {
    return pluralizePtBr(word);
  }

  return pluralizeEn(word);
}
