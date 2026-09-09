import type { ValidationResult } from './types';
import { isBlank } from './blank';
import i18n from '@/locales';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function emailValidator(value: unknown): ValidationResult {
  return {
    isValid: isBlank(value) || isValidEmail(String(value)),
    errorMessage: i18n.global.t('utils.validators.invalid'),
  };
}
