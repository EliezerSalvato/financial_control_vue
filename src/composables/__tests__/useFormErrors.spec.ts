import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { useFormErrors } from '@/composables/useFormErrors';

type SampleForm = {
  name: string;
  email: string;
};

describe('useFormErrors', () => {
  it('valida o formulário e guarda os erros', () => {
    const form: SampleForm = { name: '', email: 'ada@example.com' };
    const { errors, validateWith } = useFormErrors(form);

    expect(validateWith((handler) => handler.checkBlank(['name']))).toBe(false);
    expect(errors.value.name).toEqual(["can't be blank"]);

    form.name = 'Ada';
    expect(validateWith((handler) => handler.checkBlank(['name']))).toBe(true);
    expect(errors.value.name).toEqual([]);
  });

  it('aplica detalhes da API e reseta', () => {
    const form: SampleForm = { name: 'Ada', email: 'ada@example.com' };
    const { errors, applyCatch, resetErrors } = useFormErrors(form);

    applyCatch(
      new ApiError(422, {
        status: 'error',
        message: 'inválido',
        details: { name: ['já existe'] },
      }),
    );

    expect(errors.value.name).toEqual(['já existe']);

    applyCatch(new Error('offline'));
    expect(errors.value.base).toEqual(['Something went wrong. Please try again.']);

    resetErrors();
    expect(errors.value).toEqual({ name: [], email: [], base: [] });
  });

  it('aceita o formulário como função', () => {
    const form: SampleForm = { name: '', email: '' };
    const { validateWith } = useFormErrors(() => form);

    expect(validateWith((handler) => handler.checkBlank(['email']))).toBe(false);
  });
});
