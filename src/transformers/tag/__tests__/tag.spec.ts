import type { TagAttributesApi, TagCollectionResponseApi, TagCreateResponseApi, TagResourceItemApi } from '@/types/tag';
import { describe, expect, it } from 'vitest';
import { tagCollectionFromApi, tagCreateFromApi, tagFromResource, tagShowFromApi } from '@/transformers/tag';

const resource: TagResourceItemApi = {
  id: 'tag-1',
  type: 'tag',
  attributes: {
    id: 'tag-1',
    name: 'Trabalho',
    color: '#112233',
    active: true,
  },
};

const expectedTag = {
  id: 'tag-1',
  name: 'Trabalho',
  color: '#112233',
  active: true,
  goalEndsOn: null,
  currentGoal: null,
  goals: [],
};

describe('tagFromResource', () => {
  it('mapeia o recurso para o domínio', () => {
    expect(tagFromResource(resource)).toEqual(expectedTag);
  });

  it('usa o id do recurso e cor padrão quando o atributo falta', () => {
    expect(
      tagFromResource({
        ...resource,
        id: 'fallback-id',
        attributes: { name: 'Sem cor', active: false } as TagAttributesApi,
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
      tagFromResource({
        ...resource,
        attributes: {
          ...resource.attributes,
          goalEndsOn: '2026-12-01',
          currentGoal: {
            id: 'goal-2',
            type: 'tag_goal',
            attributes: { id: 'goal-2', month: 8, year: 2026, value: '600.0' },
          },
          goals: [
            { id: 'goal-2', type: 'tag_goal', attributes: { id: 'goal-2', month: 8, year: 2026, value: '600.0' } },
            { id: 'goal-1', type: 'tag_goal', attributes: { id: 'goal-1', month: 1, year: 2026, value: '500.0' } },
          ],
        },
      }),
    ).toEqual({
      ...expectedTag,
      goalEndsOn: '2026-12-01',
      currentGoal: { id: 'goal-2', month: 8, year: 2026, value: 600 },
      goals: [
        { id: 'goal-1', month: 1, year: 2026, value: 500 },
        { id: 'goal-2', month: 8, year: 2026, value: 600 },
      ],
    });
  });
});

describe('tag collection / show / create', () => {
  it('inclui paginação na listagem', () => {
    const response: TagCollectionResponseApi = {
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

    expect(tagCollectionFromApi(response)).toEqual({
      tags: [tagFromResource(resource)],
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

  it('devolve a tag no show e a mensagem no create', () => {
    const created: TagCreateResponseApi = {
      status: 'success',
      type: 'object',
      message: 'Tag created',
      data: resource,
    };

    expect(tagShowFromApi(created)).toEqual(tagFromResource(resource));
    expect(tagCreateFromApi(created)).toEqual({
      message: 'Tag created',
      tag: tagFromResource(resource),
    });
  });
});
