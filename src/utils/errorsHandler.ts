import type { Validator } from './validators';
import { blankValidator, confirmationValidator, emailValidator, maxLengthValidator, minLengthValidator } from './validators';
import { toCamelKey } from '@/utils/case';
import i18n from '@/locales';

export type FormFields = Record<string, unknown>;

export type ErrorField<T extends FormFields> = keyof T | 'base';

export type FormErrors<T extends FormFields> = Record<ErrorField<T>, string[]>;

export function buildFormErrors<T extends FormFields>(form: T): FormErrors<T> {
  const fields = [...Object.keys(form), 'base'];

  return Object.fromEntries(fields.map((field) => [field, [] as string[]])) as FormErrors<T>;
}

export class ErrorsHandler<T extends FormFields> {
  readonly all: FormErrors<T>;

  private readonly form: T;

  constructor(form: T) {
    this.form = form;
    this.all = buildFormErrors(form);
  }

  get isValid(): boolean {
    return Object.values(this.all).every((messages) => messages.length === 0);
  }

  add(field: ErrorField<T>, message: string): this {
    const messages = this.all[field];

    if (!messages.includes(message)) messages.push(message);

    return this;
  }

  addBase(message: string): this {
    return this.add('base', message);
  }

  addSomethingWentWrong(): this {
    return this.addBase(i18n.global.t('utils.errorsHandler.somethingWentWrong'));
  }

  check(fields: (keyof T)[], validator: Validator): this {
    fields.forEach((field) => {
      const { isValid, errorMessage } = validator(this.form[field]);

      if (!isValid) this.add(field, errorMessage);
    });

    return this;
  }

  checkBlank(fields: (keyof T)[]): this {
    return this.check(fields, blankValidator);
  }

  checkEmail(fields: (keyof T)[]): this {
    return this.check(fields, emailValidator);
  }

  checkMinLength(fields: (keyof T)[], minimum: number): this {
    return this.check(fields, minLengthValidator(minimum));
  }

  checkMaxLength(fields: (keyof T)[], maximum: number): this {
    return this.check(fields, maxLengthValidator(maximum));
  }

  checkConfirmation(field: keyof T, confirmationField: keyof T, label = String(field)): this {
    return this.check([confirmationField], confirmationValidator(this.form[field], label));
  }

  applyApiDetails(details: Record<string, string[]>, fallbackMessage?: string): this {
    const reported = Object.entries(details).filter(([, messages]) => messages?.length);

    reported.forEach(([field, messages]) => {
      messages.forEach((message) => this.add(this.errorFieldFor(field), message));
    });

    if (!reported.length && fallbackMessage) this.addBase(fallbackMessage);

    return this;
  }

  private errorFieldFor(field: string): ErrorField<T> {
    if (field in this.all) return field as keyof T;

    const camelField = toCamelKey(field);

    return camelField in this.all ? (camelField as keyof T) : 'base';
  }
}
