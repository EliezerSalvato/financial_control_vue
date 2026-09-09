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

describe('categoryFromResource', () => {
  it('mapeia o recurso para o domínio', () => {
    expect(categoryFromResource(resource)).toEqual({
      id: 'cat-1',
      name: 'Moradia',
      color: '#112233',
      active: true,
    });
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
