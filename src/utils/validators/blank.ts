import type { ValidationResult } from './types';
import i18n from '@/locales';

export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;

  if (typeof value === 'string') return value.trim() === '';

  if (Array.isArray(value)) return value.length === 0;

  return false;
}

export function blankValidator(value: unknown): ValidationResult {
  return { isValid: !isBlank(value), errorMessage: i18n.global.t('utils.validators.blank') };
}
