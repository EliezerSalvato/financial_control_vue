import { defineComponent } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { booleanFilterValue, parseActiveQuery, parsePage, parsePositiveInt, queryString, useIndexListQuery } from '@/composables/useIndexListQuery';

describe('queryString', () => {
  it('só aceita string', () => {
    expect(queryString('tags')).toBe('tags');
    expect(queryString(['tags'])).toBe('');
    expect(queryString(undefined)).toBe('');
  });
});

describe('parsePositiveInt / parsePage', () => {
  it('lê inteiros positivos e ignora o restante', () => {
    expect(parsePositiveInt('3')).toBe(3);
    expect(parsePositiveInt('0')).toBeUndefined();
    expect(parsePositiveInt('-1')).toBeUndefined();
    expect(parsePositiveInt('1.5')).toBeUndefined();
    expect(parsePositiveInt(2)).toBeUndefined();
  });

  it('usa a página 1 quando o valor é inválido', () => {
    expect(parsePage('4')).toBe(4);
    expect(parsePage('0')).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });
});

describe('parseActiveQuery / booleanFilterValue', () => {
  it('só aceita true ou false como filtro de ativo', () => {
    expect(parseActiveQuery('true')).toBe('true');
    expect(parseActiveQuery('false')).toBe('false');
    expect(parseActiveQuery('yes')).toBe('');
    expect(parseActiveQuery(['true'])).toBe('');
  });

  it('converte o filtro textual em boolean ou undefined', () => {
    expect(booleanFilterValue('true')).toBe(true);
    expect(booleanFilterValue('false')).toBe(false);
    expect(booleanFilterValue('')).toBeUndefined();
    expect(booleanFilterValue(null)).toBeUndefined();
  });
});

describe('useIndexListQuery', () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
  });

  async function mountList(initialQuery = '') {
    setActivePinia(createPinia());
    const load = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const extra: Record<string, string> = { nameCont: '' };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/items', name: 'items', component: { template: '<div />' } }],
    });

    await router.push(`/items${initialQuery}`);
    await router.isReady();

    let api!: ReturnType<typeof useIndexListQuery<'name' | 'active'>>;
    wrapper = mount(
      defineComponent({
        setup() {
          api = useIndexListQuery({
            routeName: 'items',
            sortableFields: ['name', 'active'] as const,
            extraQuery: () => extra,
            applyExtraQuery: (query) => {
              extra.nameCont = typeof query.nameCont === 'string' ? query.nameCont : '';
            },
            load,
          });
          return () => null;
        },
      }),
      { global: { plugins: [router] } },
    );

    await flushPromises();
    return { api, load, router };
  }

  it('lê a query inicial e cicla a ordenação', async () => {
    const { api, load } = await mountList('?sort=name desc&page=2');

    expect(api.page.value).toBe(2);
    expect(api.sorts.value).toEqual([{ field: 'name', direction: 'desc' }]);
    expect(load).toHaveBeenCalled();

    api.toggleSort('name');
    await flushPromises();
    expect(api.sorts.value).toEqual([]);

    api.toggleSort('name');
    await flushPromises();
    expect(api.sorts.value).toEqual([{ field: 'name', direction: 'asc' }]);

    api.toggleSort('name');
    await flushPromises();
    expect(api.sorts.value).toEqual([{ field: 'name', direction: 'desc' }]);
  });

  it('ignora campos de sort que não são permitidos', async () => {
    const { api } = await mountList('?sort=unknown asc,name desc,name asc');

    expect(api.sorts.value).toEqual([{ field: 'name', direction: 'desc' }]);
  });
});
