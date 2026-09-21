import { describe, expect, it } from 'vitest';
import {
  currentTagGoalValue,
  firstTagGoalStartsOn,
  goalEndsOnConflictsWithExistingGoals,
  lastTagGoalStartsOn,
  minGoalEndsOn,
  previousTagGoalValue,
  tagGoalStartsOn,
  tagGoalWriteFields,
  wantsTagGoal,
} from '@/utils/tagGoal';

const january = { id: '1', month: 1, year: 2026, value: 400 };
const july = { id: '2', month: 7, year: 2026, value: 600 };

describe('tagGoalStartsOn / firstTagGoalStartsOn / lastTagGoalStartsOn', () => {
  it('sempre usa o dia 01', () => {
    expect(tagGoalStartsOn(july)).toBe('2026-07-01');
    expect(firstTagGoalStartsOn([july, january])).toBe('2026-01-01');
    expect(firstTagGoalStartsOn([])).toBeNull();
    expect(lastTagGoalStartsOn([july, january])).toBe('2026-07-01');
    expect(lastTagGoalStartsOn([])).toBeNull();
  });
});

describe('minGoalEndsOn / goalEndsOnConflictsWithExistingGoals', () => {
  it('só permite data de fim após o último mês que já tem meta', () => {
    expect(minGoalEndsOn([january])).toBe('2026-02-01');
    expect(minGoalEndsOn([january, july])).toBe('2026-08-01');
    expect(minGoalEndsOn([])).toBeNull();
    expect(goalEndsOnConflictsWithExistingGoals('2026-01-01', [january])).toBe(true);
    expect(goalEndsOnConflictsWithExistingGoals('2026-07-01', [january, july])).toBe(true);
    expect(goalEndsOnConflictsWithExistingGoals('2026-02-01', [january])).toBe(false);
    expect(goalEndsOnConflictsWithExistingGoals('2026-08-01', [january, july])).toBe(false);
    expect(goalEndsOnConflictsWithExistingGoals(null, [january])).toBe(false);
    expect(goalEndsOnConflictsWithExistingGoals('2026-01-01', [])).toBe(false);
  });
});

describe('currentTagGoalValue / previousTagGoalValue', () => {
  it('usa a meta vigente e a linha anterior ao mês escolhido', () => {
    expect(currentTagGoalValue({ currentGoal: july, goals: [january, july] })).toBe(600);
    expect(currentTagGoalValue({ currentGoal: null, goals: [january, july] })).toBe(600);
    expect(previousTagGoalValue([january, july], '2026-07-01', null)).toBe(600);
    expect(previousTagGoalValue([january, july], '2026-08-01', null)).toBe(600);
    expect(previousTagGoalValue([january, july], '2026-03-01', null)).toBe(400);
    expect(previousTagGoalValue([], '2026-03-01', 250)).toBe(250);
  });
});

describe('wantsTagGoal / tagGoalWriteFields', () => {
  it('normaliza as datas para o primeiro dia do mês', () => {
    expect(wantsTagGoal({ goalStartsOn: null, goalValue: null, goalEndsOn: null })).toBe(false);
    expect(wantsTagGoal({ goalStartsOn: null, goalValue: 0, goalEndsOn: null })).toBe(true);
    expect(
      tagGoalWriteFields({
        goalStartsOn: '2026-07-31',
        goalValue: 500,
        goalEndsOn: '2026-12-15',
      }),
    ).toEqual({
      goalStartsOn: '2026-07-01',
      goalValue: 500,
      goalEndsOn: '2026-12-01',
    });
  });
});
