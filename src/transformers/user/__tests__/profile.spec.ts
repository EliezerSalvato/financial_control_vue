import { describe, expect, it } from 'vitest';
import { profileTransformer } from '@/transformers/user';

describe('profileTransformer.toApi', () => {
  it('omite campos indefinidos', () => {
    expect(profileTransformer.toApi({})).toEqual({});
  });

  it('serializa só os campos presentes', () => {
    expect(profileTransformer.toApi({ firstName: 'Ada' })).toEqual({ first_name: 'Ada' });
    expect(profileTransformer.toApi({ lastName: 'Lovelace' })).toEqual({ last_name: 'Lovelace' });
    expect(profileTransformer.toApi({ configs: { locale: 'pt-BR' } })).toEqual({
      configs: { locale: 'pt-BR' },
    });
  });

  it('envia os três campos juntos quando todos vêm', () => {
    expect(
      profileTransformer.toApi({
        firstName: 'Ada',
        lastName: 'Lovelace',
        configs: { locale: 'en' },
      }),
    ).toEqual({
      first_name: 'Ada',
      last_name: 'Lovelace',
      configs: { locale: 'en' },
    });
  });
});
