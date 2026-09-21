import type { CategoryAttributesApi, CategoryCollectionResponseApi, CategoryCreateResponseApi, CategoryResourceItemApi } from '@/types/category';
import { describe, expect, it } from 'vitest';
import { categoryCollectionFromApi, categoryCreateFromApi, categoryFromResource, categoryShowFromApi } from '@/transformers/category';

const resource: CategoryResourceItemApi = {
  id: 'cat-1',
  type: 'category',
  attributes: {
    id: 'cat-1',
    name: 'Moradia',
    color: '#112233',
    active: true,
  },
};

const expectedCategory = {
  id: 'cat-1',
  name: 'Moradia',
  color: '#112233',
  active: true,
  goalEndsOn: null,
  currentGoal: null,
  goals: [],
};

describe('categoryFromResource', () => {
  it('mapeia o recurso para o domínio', () => {
    expect(categoryFromResource(resource)).toEqual(expectedCategory);
  });

  it('usa o id do recurso e cor padrão quando o atributo falta', () => {
    expect(
      categoryFromResource({
        ...resource,
        id: 'fallback-id',
        attributes: { name: 'Sem cor', active: false } as CategoryAttributesApi,
      }),
    ).toEqual({
      id: 'fallback-id',
      name: 'Sem cor',
      color: '#000000',
      active: false,
      goalEndsOn: null,
      currentGoal: null,
      goals: [],
    });
  });

  it('mapeia a meta atual e o histórico ordenado por ano e mês', () => {
    expect(
      categoryFromResource({
        ...resource,
        attributes: {
          ...resource.attributes,
          goalEndsOn: '2026-12-01',
          currentGoal: {
            id: 'goal-2',
            type: 'category_goal',
            attributes: { id: 'goal-2', month: 8, year: 2026, value: '600.0' },
          },
          goals: [
            { id: 'goal-2', type: 'category_goal', attributes: { id: 'goal-2', month: 8, year: 2026, value: '600.0' } },
            { id: 'goal-1', type: 'category_goal', attributes: { id: 'goal-1', month: 1, year: 2026, value: '500.0' } },
          ],
        },
      }),
    ).toEqual({
      ...expectedCategory,
      goalEndsOn: '2026-12-01',
      currentGoal: { id: 'goal-2', month: 8, year: 2026, value: 600 },
      goals: [
        { id: 'goal-1', month: 1, year: 2026, value: 500 },
        { id: 'goal-2', month: 8, year: 2026, value: 600 },
      ],
    });
  });
});

describe('category collection / show / create', () => {
  it('inclui paginação na listagem', () => {
    const response: CategoryCollectionResponseApi = {
      status: 'success',
      type: 'collection',
      data: [resource],
      meta: {
        page: 2,
        per_page: 10,
        count: 11,
        pages: 2,
        next_page: null,
        prev_page: 1,
      },
    };

    expect(categoryCollectionFromApi(response)).toEqual({
      categories: [categoryFromResource(resource)],
      pagination: {
        currentPage: 2,
        prevPage: 1,
        nextPage: null,
        totalPages: 2,
        totalCount: 11,
        offsetValue: 10,
        size: 1,
      },
    });
  });

  it('devolve a categoria no show e a mensagem no create', () => {
    const created: CategoryCreateResponseApi = {
      status: 'success',
      type: 'object',
      message: 'Category created',
      data: resource,
    };

    expect(categoryShowFromApi(created)).toEqual(categoryFromResource(resource));
    expect(categoryCreateFromApi(created)).toEqual({
      message: 'Category created',
      category: categoryFromResource(resource),
    });
  });
});
