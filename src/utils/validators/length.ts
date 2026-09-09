import type { Validator } from './types';
import { isBlank } from './blank';
import i18n from '@/locales';

export function minLengthValidator(minimum: number): Validator {
  return (value) => ({
    isValid: isBlank(value) || String(value).length >= minimum,
    errorMessage: i18n.global.t('utils.validators.tooShort', { minimum }),
  });
}

export function maxLengthValidator(maximum: number): Validator {
  return (value) => ({
    isValid: isBlank(value) || String(value).length <= maximum,
    errorMessage: i18n.global.t('utils.validators.tooLong', { maximum }),
  });
}
