import type { GoalTargetResourceItemApi } from '@/types/goal';
import { describe, expect, it } from 'vitest';
import { goalTargetCollectionFromApi, goalTargetFromResource } from '@/transformers/goal';

function resource(value: string | number | null, extras: Record<string, unknown> = {}): GoalTargetResourceItemApi {
  return {
    id: 'cat-1',
    type: 'goal_target',
    attributes: {
      id: 'cat-1',
      kind: 'category',
      name: 'Moradia',
      value,
      ...extras,
    },
  } as GoalTargetResourceItemApi;
}

describe('goalTargetFromResource', () => {
  it('converte valor decimal', () => {
    expect(goalTargetFromResource(resource('2000.0'))).toEqual({
      id: 'cat-1',
      kind: 'category',
      name: 'Moradia',
      color: '#000000',
      value: 2000,
    });

    expect(goalTargetFromResource(resource(1000)).value).toBe(1000);
    expect(goalTargetFromResource(resource(null)).value).toBe(0);
    expect(goalTargetFromResource(resource(1000, { color: '#ff0000' })).color).toBe('#ff0000');
  });

  it('usa o id do recurso quando o atributo falta', () => {
    expect(
      goalTargetFromResource({
        id: 'tag-1',
        type: 'goal_target',
        attributes: {
          kind: 'tag',
          name: 'Casa',
          value: '400.0',
        } as GoalTargetResourceItemApi['attributes'],
      }),
    ).toEqual({
      id: 'tag-1',
      kind: 'tag',
      name: 'Casa',
      color: '#000000',
      value: 400,
    });
  });
});

describe('goalTargetCollectionFromApi', () => {
  it('mapeia a coleção', () => {
    expect(goalTargetCollectionFromApi({ status: 'success', type: 'collection', data: [resource(1)] })).toEqual({
      goalTargets: [goalTargetFromResource(resource(1))],
    });
  });
});
