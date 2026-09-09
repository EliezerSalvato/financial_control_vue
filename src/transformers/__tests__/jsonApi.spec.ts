import type { PaginationMetaApi } from '@/types/api/pagination';
import { describe, expect, it } from 'vitest';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';

const meta: PaginationMetaApi = {
  page: 2,
  per_page: 10,
  count: 11,
  pages: 2,
  next_page: null,
  prev_page: 1,
};

describe('resourceId', () => {
  it('prioriza o id dos atributos e cai para o id do recurso', () => {
    expect(resourceId({ id: 'attr-1' }, { id: 'resource-1' })).toBe('attr-1');
    expect(resourceId({}, { id: 'resource-1' })).toBe('resource-1');
  });
});

describe('collectionFromApi', () => {
  it('mapeia os itens e anexa a paginação com a chave informada', () => {
    expect(
      collectionFromApi(
        {
          data: [{ id: 'a' }, { id: 'b' }],
          meta,
        },
        (resource) => resource.id.toUpperCase(),
        'items',
      ),
    ).toEqual({
      items: ['A', 'B'],
      pagination: {
        currentPage: 2,
        prevPage: 1,
        nextPage: null,
        totalPages: 2,
        totalCount: 11,
        offsetValue: 10,
        size: 2,
      },
    });
  });

  it('aceita coleção vazia', () => {
    expect(collectionFromApi({ data: [], meta }, (item: string) => item, 'tags')).toEqual({
      tags: [],
      pagination: {
        currentPage: 2,
        prevPage: 1,
        nextPage: null,
        totalPages: 2,
        totalCount: 11,
        offsetValue: 10,
        size: 0,
      },
    });
  });
});

describe('createResultFromApi', () => {
  it('devolve a mensagem e a entidade mapeada', () => {
    expect(createResultFromApi({ message: 'Criado', data: { id: 'tag-1' } }, (resource) => ({ key: resource.id }), 'tag')).toEqual({
      message: 'Criado',
      tag: { key: 'tag-1' },
    });
  });
});
