import type { Validator } from './types';
import { isBlank } from './blank';
import i18n from '@/locales';

export function formatValidator(pattern: RegExp, errorMessage?: string): Validator {
  return (value) => ({
    isValid: isBlank(value) || pattern.test(String(value)),
    errorMessage: errorMessage ?? i18n.global.t('utils.validators.invalid'),
  });
}
