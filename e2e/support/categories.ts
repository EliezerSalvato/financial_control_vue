import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type CategoryGoalRecord = {
  id: string;
  month: number;
  year: number;
  value: number;
};

export type CategoryRecord = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  goalEndsOn?: string | null;
  goals?: CategoryGoalRecord[];
};

export const defaultCategories: CategoryRecord[] = [
  { id: '1', name: 'Food', color: '#ff0000', active: true, goalEndsOn: null, goals: [] },
  { id: '2', name: 'Transport', color: '#00ff00', active: true, goalEndsOn: null, goals: [] },
  { id: '3', name: 'Archive', color: '#0000ff', active: false, goalEndsOn: null, goals: [] },
];

type SortEntry = { field: 'name' | 'active'; direction: 'asc' | 'desc' };
type CategoryAttrs = {
  name?: string;
  color?: string;
  active?: boolean;
  goal_starts_on?: string;
  goalStartsOn?: string;
  goal_value?: number;
  goalValue?: number;
  goal_ends_on?: string | null;
  goalEndsOn?: string | null;
};
type GoalAttrs = {
  value?: number;
  starts_on?: string;
  startsOn?: string;
  change_for_next_months?: boolean;
  changeForNextMonths?: boolean;
};

function yearMonthFromIso(iso: string | null | undefined): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})/.exec(iso ?? '');
  const year = match ? Number(match[1]) : NaN;
  const month = match ? Number(match[2]) : NaN;

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;

  return { year, month };
}

function monthStartIso(year: number, month: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
}

function yearMonthTotal(year: number, month: number) {
  return year * 12 + (month - 1);
}

function normalizeGoals(goals: CategoryGoalRecord[] = []) {
  return [...goals].sort((left, right) => yearMonthTotal(left.year, left.month) - yearMonthTotal(right.year, right.month));
}

function currentGoal(category: CategoryRecord): CategoryGoalRecord | null {
  const goals = normalizeGoals(category.goals);
  const endsOn = yearMonthFromIso(category.goalEndsOn);
  const now = new Date();
  const currentTotal = now.getFullYear() * 12 + now.getMonth();

  if (endsOn && currentTotal > yearMonthTotal(endsOn.year, endsOn.month)) return null;

  const applicable = goals.filter((goal) => yearMonthTotal(goal.year, goal.month) <= currentTotal);

  return applicable.at(-1) ?? goals[0] ?? null;
}

function goalResource(goal: CategoryGoalRecord) {
  return {
    id: goal.id,
    type: 'category_goal' as const,
    attributes: {
      id: goal.id,
      month: goal.month,
      year: goal.year,
      value: goal.value.toFixed(1),
    },
  };
}

function categoryResource(category: CategoryRecord) {
  const goals = normalizeGoals(category.goals);
  const current = currentGoal(category);

  return {
    id: category.id,
    type: 'category' as const,
    attributes: {
      id: category.id,
      name: category.name,
      color: category.color,
      active: category.active,
      goal_ends_on: category.goalEndsOn ?? null,
      current_goal: current ? goalResource(current) : null,
      goals: goals.map(goalResource),
    },
  };
}

function parseSort(value: string | null): SortEntry[] {
  if (!value?.trim()) {
    return [];
  }

  const entries: SortEntry[] = [];

  for (const part of value.split(',')) {
    const [field, direction] = part.trim().split(/\s+/);

    if ((field === 'name' || field === 'active') && (direction === 'asc' || direction === 'desc')) {
      entries.push({ field, direction });
    }
  }

  return entries;
}

function compareCategories(left: CategoryRecord, right: CategoryRecord, sorts: SortEntry[]): number {
  for (const sort of sorts) {
    const leftValue = left[sort.field];
    const rightValue = right[sort.field];

    if (leftValue === rightValue) {
      continue;
    }

    const result = leftValue < rightValue ? -1 : 1;

    return sort.direction === 'asc' ? result : -result;
  }

  return 0;
}

function payloadString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export class CategoriesApi {
  categories: CategoryRecord[];
  defaultPerPage: number;
  nextId: number;
  nextGoalId: number;

  constructor(categories: CategoryRecord[] = defaultCategories, defaultPerPage = 25) {
    this.categories = categories.map((category) => ({
      ...category,
      goalEndsOn: category.goalEndsOn ?? null,
      goals: normalizeGoals(category.goals).map((goal) => ({ ...goal })),
    }));
    this.defaultPerPage = defaultPerPage;
    this.nextId = categories.reduce((max, category) => Math.max(max, Number(category.id) || 0), 0) + 1;
    this.nextGoalId = categories.reduce((max, category) => Math.max(max, ...(category.goals ?? []).map((goal) => Number(goal.id) || 0)), 0) + 1;
  }

  find(id: string) {
    return this.categories.find((category) => category.id === id);
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);
    const goalsId = path.match(/\/api\/v1\/categories\/([^/]+)\/goals$/)?.[1];
    const id = path.match(/\/api\/v1\/categories\/([^/]+)$/)?.[1];

    if (goalsId && method === 'PATCH') {
      return this.updateGoal(route, goalsId);
    }

    if (!id && method === 'GET') {
      return this.list(route, apiSearch(url));
    }

    if (!id && method === 'POST') {
      return this.create(route);
    }

    if (id && method === 'GET') {
      return this.show(route, id);
    }

    if (id && method === 'PATCH') {
      return this.update(route, id);
    }

    if (id && method === 'DELETE') {
      return this.destroy(route, id);
    }

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }

  private list(route: Route, search: URLSearchParams) {
    const nameCont = search.get('q[name_cont]')?.trim().toLowerCase();
    const activeEq = search.get('q[active_eq]');
    const page = Number(search.get('page') ?? 1);
    const perPage = Number(search.get('per_page') ?? this.defaultPerPage);
    const sorts = parseSort(search.get('sort'));

    let items = [...this.categories];

    if (nameCont) {
      items = items.filter((category) => category.name.toLowerCase().includes(nameCont));
    }

    if (activeEq === 'true' || activeEq === 'false') {
      const active = activeEq === 'true';
      items = items.filter((category) => category.active === active);
    }

    if (sorts.length) {
      items.sort((left, right) => compareCategories(left, right, sorts));
    }

    const pages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
    const offset = (currentPage - 1) * perPage;
    const pageItems = items.slice(offset, offset + perPage);

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: pageItems.map(categoryResource),
      meta: {
        page: currentPage,
        per_page: perPage,
        count: items.length,
        pages,
        next_page: currentPage < pages ? currentPage + 1 : null,
        prev_page: currentPage > 1 ? currentPage - 1 : null,
      },
    });
  }

  private startGoal(category: CategoryRecord, startsOn: string, value: number, endsOn?: string | null) {
    const parsed = yearMonthFromIso(startsOn);

    if (!parsed) return;

    category.goals = [
      {
        id: String(this.nextGoalId++),
        month: parsed.month,
        year: parsed.year,
        value,
      },
    ];
    category.goalEndsOn = endsOn
      ? monthStartIso(yearMonthFromIso(endsOn)?.year ?? parsed.year, yearMonthFromIso(endsOn)?.month ?? parsed.month)
      : null;
  }

  private async create(route: Route) {
    const payload = (await route.request().postDataJSON()) as { category?: CategoryAttrs };
    const name = payload.category?.name?.trim() ?? '';
    const color = payload.category?.color?.trim() ?? '';
    const goalStartsOn = payloadString(payload.category?.goal_starts_on ?? payload.category?.goalStartsOn);
    const goalValue = payload.category?.goal_value ?? payload.category?.goalValue;
    const goalEndsOn = payload.category?.goal_ends_on ?? payload.category?.goalEndsOn;

    if (!name) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ["can't be blank"] } }, 422);
    }

    if (this.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ['has already been taken'] } }, 422);
    }

    if ((goalStartsOn && goalValue == null) || (!goalStartsOn && goalValue != null) || (goalEndsOn && (!goalStartsOn || goalValue == null))) {
      return fulfillJson(
        route,
        {
          status: 'error',
          message: 'Validation failed',
          details: {
            ...(goalStartsOn ? {} : { goal_starts_on: ["can't be blank"] }),
            ...(goalValue == null ? { goal_value: ["can't be blank"] } : {}),
          },
        },
        422,
      );
    }

    const category: CategoryRecord = {
      id: String(this.nextId++),
      name,
      color: color || '#000000',
      active: true,
      goalEndsOn: null,
      goals: [],
    };

    if (goalStartsOn && goalValue != null) {
      this.startGoal(category, goalStartsOn, goalValue, typeof goalEndsOn === 'string' ? goalEndsOn : null);
    }

    this.categories.push(category);

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Category was successfully created.',
      data: categoryResource(category),
    });
  }

  private show(route: Route, id: string) {
    const category = this.find(id);

    if (!category) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      data: categoryResource(category),
    });
  }

  private async update(route: Route, id: string) {
    const category = this.find(id);

    if (!category) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    const payload = (await route.request().postDataJSON()) as { category?: CategoryAttrs };
    const goalStartsOn = payloadString(payload.category?.goal_starts_on ?? payload.category?.goalStartsOn);
    const goalValue = payload.category?.goal_value ?? payload.category?.goalValue;
    const goalEndsOn = payload.category?.goal_ends_on ?? payload.category?.goalEndsOn;

    category.name = payload.category?.name?.trim() ?? category.name;
    category.color = payload.category?.color?.trim() ?? category.color;
    category.active = payload.category?.active ?? category.active;

    if (goalStartsOn || goalValue != null) {
      if (category.goals?.length) {
        return fulfillJson(
          route,
          {
            status: 'error',
            message: 'Validation failed',
            details: {
              goal_starts_on: ['cannot be changed when a goal already exists'],
              goal_value: ['cannot be changed when a goal already exists'],
            },
          },
          422,
        );
      }

      if (!goalStartsOn || goalValue == null) {
        return fulfillJson(
          route,
          {
            status: 'error',
            message: 'Validation failed',
            details: {
              ...(goalStartsOn ? {} : { goal_starts_on: ["can't be blank"] }),
              ...(goalValue == null ? { goal_value: ["can't be blank"] } : {}),
            },
          },
          422,
        );
      }

      this.startGoal(category, goalStartsOn, goalValue, typeof goalEndsOn === 'string' ? goalEndsOn : category.goalEndsOn);
    } else if (typeof goalEndsOn === 'string') {
      const parsed = yearMonthFromIso(goalEndsOn);
      category.goalEndsOn = parsed ? monthStartIso(parsed.year, parsed.month) : category.goalEndsOn;
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Category was successfully updated.',
      data: categoryResource(category),
    });
  }

  private async updateGoal(route: Route, id: string) {
    const category = this.find(id);

    if (!category) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    const payload = (await route.request().postDataJSON()) as { category_goal?: GoalAttrs; categoryGoal?: GoalAttrs };
    const attrs = payload.category_goal ?? payload.categoryGoal ?? {};
    const startsOn = payloadString(attrs.starts_on ?? attrs.startsOn);
    const value = attrs.value;
    const changeForNextMonths = Boolean(attrs.change_for_next_months ?? attrs.changeForNextMonths);
    const parsed = yearMonthFromIso(startsOn);

    if (!parsed) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { starts_on: ["can't be blank"] } }, 422);
    }

    if (value == null || !Number.isFinite(value)) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { value: ["can't be blank"] } }, 422);
    }

    const startsTotal = yearMonthTotal(parsed.year, parsed.month);
    const endsOn = yearMonthFromIso(category.goalEndsOn);

    if (endsOn && startsTotal > yearMonthTotal(endsOn.year, endsOn.month)) {
      return fulfillJson(
        route,
        { status: 'error', message: 'Validation failed', details: { starts_on: ['must be on or before goal_ends_on'] } },
        422,
      );
    }

    const goals = normalizeGoals(category.goals);
    const existing = goals.find((goal) => goal.year === parsed.year && goal.month === parsed.month);
    const previous = [...goals].reverse().find((goal) => yearMonthTotal(goal.year, goal.month) <= startsTotal);
    const oldValue = existing?.value ?? previous?.value ?? null;

    if (oldValue != null && oldValue === value) {
      return fulfillJson(
        route,
        { status: 'error', message: 'Validation failed', details: { value: ['must be different from the previous goal'] } },
        422,
      );
    }

    if (existing) {
      existing.value = value;
    } else {
      goals.push({
        id: String(this.nextGoalId++),
        month: parsed.month,
        year: parsed.year,
        value,
      });
    }

    if (changeForNextMonths) {
      category.goals = normalizeGoals(goals).filter((goal) => yearMonthTotal(goal.year, goal.month) <= startsTotal);
    } else {
      const next = parsed.month === 12 ? { year: parsed.year + 1, month: 1 } : { year: parsed.year, month: parsed.month + 1 };
      const nextTotal = yearMonthTotal(next.year, next.month);
      const hasNext = goals.some((goal) => goal.year === next.year && goal.month === next.month);
      const afterEnd = endsOn ? nextTotal > yearMonthTotal(endsOn.year, endsOn.month) : false;

      if (oldValue != null && !hasNext && !afterEnd) {
        goals.push({
          id: String(this.nextGoalId++),
          month: next.month,
          year: next.year,
          value: oldValue,
        });
      }

      category.goals = normalizeGoals(goals);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Goal created or updated successfully',
      data: categoryResource(category),
    });
  }

  private destroy(route: Route, id: string) {
    const category = this.find(id);

    if (!category) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    this.categories = this.categories.filter((item) => category.id !== item.id);

    return fulfillJson(route, {
      status: 'success',
      message: 'Category was successfully deleted.',
    });
  }
}

export async function mockCategoriesApi(page: Page, categories = new CategoriesApi()) {
  await page.route(/\/api\/v1\/categories(\/|\?|$)/, (route) => categories.handle(route));

  return categories;
}
