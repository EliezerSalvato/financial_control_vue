import type { GoalTarget, GoalTransaction } from '@/types/goal';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import i18n from '@/locales';
import Board from '@/pages/goals/Board.vue';

const targets: GoalTarget[] = [
  { id: 'cat-1', kind: 'category', name: 'Moradia', color: '#ff0000', value: 2000 },
  { id: 'cat-2', kind: 'category', name: 'Transporte', color: '#00ff00', value: 400 },
  { id: 'cat-3', kind: 'category', name: 'Lazer', color: '#ffff00', value: 300 },
  { id: 'tag-1', kind: 'tag', name: 'Casa', color: '#0000ff', value: 1000 },
];

const transactions: GoalTransaction[] = [
  {
    id: 'tx-1',
    kind: 'expense',
    description: 'Aluguel',
    recurrenceType: 'one_time',
    value: 1500,
    firstRecurrenceOn: '2026-09-05',
    currentRecurrenceOn: '2026-09-05',
    endsOn: null,
    categoryId: 'cat-1',
    tagIds: ['tag-1'],
  },
  {
    id: 'tx-2',
    kind: 'expense',
    description: 'Condomínio',
    recurrenceType: 'one_time',
    value: 300,
    firstRecurrenceOn: '2026-09-10',
    currentRecurrenceOn: '2026-09-10',
    endsOn: null,
    categoryId: 'cat-1',
    tagIds: [],
  },
  {
    id: 'tx-3',
    kind: 'expense',
    description: 'Combustível',
    recurrenceType: 'one_time',
    value: 100,
    firstRecurrenceOn: '2026-09-12',
    currentRecurrenceOn: '2026-09-12',
    endsOn: null,
    categoryId: 'cat-2',
    tagIds: [],
  },
];

function mountBoard(kind: GoalTarget['kind'] = 'category', extra: { targets?: GoalTarget[]; transactions?: GoalTransaction[] } = {}) {
  return mount(Board, {
    props: { kind, targets: extra.targets ?? targets, transactions: extra.transactions ?? transactions },
    global: {
      plugins: [i18n],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="JSON.stringify(to)"><slot /></a>',
        },
      },
    },
  });
}

describe('goals Board', () => {
  it('agrupa transações nas metas e pinta o percentual', () => {
    const wrapper = mountBoard();

    expect(wrapper.get('.panel-heading p').text()).toBe('By Categories');
    expect(wrapper.text()).toContain('Moradia');
    expect(wrapper.text()).toContain('Transporte');
    expect(wrapper.text()).toContain('Lazer');
    expect(wrapper.text()).not.toContain('Casa');
    expect(wrapper.get('tr.goal-color-danger').text()).toContain('Moradia');
    expect(wrapper.get('tr.goal-color-danger').text()).toContain('90%');
    expect(wrapper.get('tr.goal-color-success').text()).toContain('Transporte');
    expect(wrapper.get('tr.goal-color-danger .target-color').attributes('title')).toBe('#ff0000');
    expect(wrapper.get('tr.goal-color-success .target-color').attributes('title')).toBe('#00ff00');
    expect(
      wrapper
        .findAll('tbody > tr')
        .find((row) => row.text().includes('Lazer'))
        ?.classes(),
    ).not.toContain('goal-color-success');
    expect(wrapper.find('.goal-diff-negative').exists()).toBe(false);
  });

  it('pinta a diferença negativa em vermelho', () => {
    const wrapper = mountBoard('tag');

    expect(wrapper.get('.goal-diff-negative').text()).toContain('500');
    expect(wrapper.get('.target-color').attributes('title')).toBe('#0000ff');
  });

  it('inverte cores e diferença nas receitas acima da meta', () => {
    const wrapper = mountBoard('category', {
      targets: [{ id: 'cat-1', kind: 'category', name: 'Salário', color: '#00aa00', value: 1000 }],
      transactions: [
        {
          id: 'tx-income',
          kind: 'income',
          description: 'Folha',
          recurrenceType: 'one_time',
          value: 1200,
          firstRecurrenceOn: '2026-09-05',
          currentRecurrenceOn: '2026-09-05',
          endsOn: null,
          categoryId: 'cat-1',
          tagIds: [],
        },
      ],
    });

    expect(wrapper.get('tr.goal-color-success').text()).toContain('Salário');
    expect(wrapper.get('tr.goal-color-success').text()).toContain('120%');
    expect(wrapper.get('.goal-diff-positive').text()).toContain('200');
    expect(wrapper.find('.goal-diff-negative').exists()).toBe(false);
  });

  it('expande as transações da meta', async () => {
    const wrapper = mountBoard();

    await wrapper
      .findAll('tbody > tr')
      .find((row) => row.text().includes('Moradia'))
      ?.get('button.expand')
      .trigger('click');

    expect(wrapper.get('a[href*="tx-1"]').text()).toContain('Aluguel');
    expect(wrapper.get('a[href*="tx-2"]').text()).toContain('Condomínio');
  });
});
