import type { Validator } from './types';
import { isBlank } from './blank';
import i18n from '@/locales';

export function confirmationValidator(expected: unknown, label: string): Validator {
  return (value) => ({
    isValid: isBlank(value) || value === expected,
    errorMessage: i18n.global.t('utils.validators.confirmation', { label }),
  });
}
