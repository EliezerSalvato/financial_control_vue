import { ErrorsHandler, buildFormErrors } from '@/utils/errorsHandler';
import { describe, expect, it } from 'vitest';

type SampleForm = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

const form: SampleForm = {
  name: '',
  email: 'invalid',
  password: 'secret',
  passwordConfirmation: 'other',
};

describe('buildFormErrors', () => {
  it('cria listas vazias para cada campo e base', () => {
    expect(buildFormErrors(form)).toEqual({
      name: [],
      email: [],
      password: [],
      passwordConfirmation: [],
      base: [],
    });
  });
});

describe('ErrorsHandler', () => {
  it('acumula validações locais sem duplicar a mesma mensagem', () => {
    const errors = new ErrorsHandler(form).checkBlank(['name']).checkEmail(['email']).checkConfirmation('password', 'passwordConfirmation');

    expect(errors.isValid).toBe(false);
    expect(errors.all.name).toEqual(["can't be blank"]);
    expect(errors.all.email).toEqual(['is invalid']);
    expect(errors.all.passwordConfirmation).toEqual(["doesn't match password"]);

    errors.add('name', "can't be blank");
    expect(errors.all.name).toHaveLength(1);
  });

  it('mapeia detalhes da API para campos camelCase e o restante para base', () => {
    const errors = new ErrorsHandler(form).applyApiDetails({
      name: ['já existe'],
      password_confirmation: ['não corresponde'],
      unknown_field: ['erro remoto'],
    });

    expect(errors.all.name).toEqual(['já existe']);
    expect(errors.all.passwordConfirmation).toEqual(['não corresponde']);
    expect(errors.all.base).toEqual(['erro remoto']);
  });

  it('usa fallback em base quando a API não envia detalhes', () => {
    const errors = new ErrorsHandler(form).applyApiDetails({}, 'falhou');

    expect(errors.all.base).toEqual(['falhou']);
    expect(errors.addSomethingWentWrong().all.base).toEqual(['falhou', 'Something went wrong. Please try again.']);
  });
});
