import type { UserResource } from '@/types/user';
import { describe, expect, it } from 'vitest';
import { userFromResource, userTransformer } from '@/transformers/user';

describe('userTransformer', () => {
  it('monta fullName e configs vazias a partir da API', () => {
    expect(
      userTransformer.fromApi({
        id: 'user-1',
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
      }),
    ).toEqual({
      id: 'user-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      configs: {},
      fullName: 'Ada Lovelace',
    });
  });

  it('remove fullName ao serializar de volta', () => {
    expect(
      userTransformer.toApi({
        id: 'user-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        configs: { locale: 'pt-BR' },
        fullName: 'Ada Lovelace',
      }),
    ).toEqual({
      id: 'user-1',
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
      configs: { locale: 'pt-BR' },
    });
  });
});

describe('userFromResource', () => {
  it('usa o id do recurso quando o atributo não vem', () => {
    const resource: UserResource = {
      data: {
        id: 'user-99',
        type: 'user',
        attributes: {
          first_name: 'Ada',
          last_name: '',
          email: 'ada@example.com',
        },
      },
    };

    expect(userFromResource(resource)).toMatchObject({
      id: 'user-99',
      fullName: 'Ada',
    });
  });
});
