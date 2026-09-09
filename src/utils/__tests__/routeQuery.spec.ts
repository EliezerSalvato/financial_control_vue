import { describe, expect, it } from 'vitest';
import { appQueryToRoute, routeQueryToApp } from '@/utils/routeQuery';

describe('routeQuery', () => {
  it('converte query da app para snake_case na rota', () => {
    expect(appQueryToRoute({ nameCont: 'foo', perPage: '10' })).toEqual({
      name_cont: 'foo',
      per_page: '10',
    });
  });

  it('converte query da rota para camelCase na app', () => {
    expect(routeQueryToApp({ name_cont: 'foo', per_page: '10' })).toEqual({
      nameCont: 'foo',
      perPage: '10',
    });
  });
});
