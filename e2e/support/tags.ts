import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type TagGoalRecord = {
  id: string;
  month: number;
  year: number;
  value: number;
};

export type TagRecord = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  goalEndsOn?: string | null;
  goals?: TagGoalRecord[];
};

export const defaultTags: TagRecord[] = [
  { id: '1', name: 'Work', color: '#ff0000', active: true, goalEndsOn: null, goals: [] },
  { id: '2', name: 'Home', color: '#00ff00', active: true, goalEndsOn: null, goals: [] },
  { id: '3', name: 'Archive', color: '#0000ff', active: false, goalEndsOn: null, goals: [] },
];

type SortEntry = { field: 'name' | 'active'; direction: 'asc' | 'desc' };
type TagAttrs = {
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

function normalizeGoals(goals: TagGoalRecord[] = []) {
  return [...goals].sort((left, right) => yearMonthTotal(left.year, left.month) - yearMonthTotal(right.year, right.month));
}

function currentGoal(tag: TagRecord): TagGoalRecord | null {
  const goals = normalizeGoals(tag.goals);
  const endsOn = yearMonthFromIso(tag.goalEndsOn);
  const now = new Date();
  const currentTotal = now.getFullYear() * 12 + now.getMonth();

  if (endsOn && currentTotal > yearMonthTotal(endsOn.year, endsOn.month)) return null;

  const applicable = goals.filter((goal) => yearMonthTotal(goal.year, goal.month) <= currentTotal);

  return applicable.at(-1) ?? goals[0] ?? null;
}

function goalResource(goal: TagGoalRecord) {
  return {
    id: goal.id,
    type: 'tag_goal' as const,
    attributes: {
      id: goal.id,
      month: goal.month,
      year: goal.year,
      value: goal.value.toFixed(1),
    },
  };
}

function tagResource(tag: TagRecord) {
  const goals = normalizeGoals(tag.goals);
  const current = currentGoal(tag);

  return {
    id: tag.id,
    type: 'tag' as const,
    attributes: {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      active: tag.active,
      goal_ends_on: tag.goalEndsOn ?? null,
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

function compareTags(left: TagRecord, right: TagRecord, sorts: SortEntry[]): number {
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

export class TagsApi {
  tags: TagRecord[];
  defaultPerPage: number;
  nextId: number;
  nextGoalId: number;

  constructor(tags: TagRecord[] = defaultTags, defaultPerPage = 25) {
    this.tags = tags.map((tag) => ({
      ...tag,
      goalEndsOn: tag.goalEndsOn ?? null,
      goals: normalizeGoals(tag.goals).map((goal) => ({ ...goal })),
    }));
    this.defaultPerPage = defaultPerPage;
    this.nextId = tags.reduce((max, tag) => Math.max(max, Number(tag.id) || 0), 0) + 1;
    this.nextGoalId = tags.reduce((max, tag) => Math.max(max, ...(tag.goals ?? []).map((goal) => Number(goal.id) || 0)), 0) + 1;
  }

  find(id: string) {
    return this.tags.find((tag) => tag.id === id);
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);
    const goalsId = path.match(/\/api\/v1\/tags\/([^/]+)\/goals$/)?.[1];
    const id = path.match(/\/api\/v1\/tags\/([^/]+)$/)?.[1];

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

    let items = [...this.tags];

    if (nameCont) {
      items = items.filter((tag) => tag.name.toLowerCase().includes(nameCont));
    }

    if (activeEq === 'true' || activeEq === 'false') {
      const active = activeEq === 'true';
      items = items.filter((tag) => tag.active === active);
    }

    if (sorts.length) {
      items.sort((left, right) => compareTags(left, right, sorts));
    }

    const pages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
    const offset = (currentPage - 1) * perPage;
    const pageItems = items.slice(offset, offset + perPage);

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: pageItems.map(tagResource),
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

  private startGoal(tag: TagRecord, startsOn: string, value: number, endsOn?: string | null) {
    const parsed = yearMonthFromIso(startsOn);

    if (!parsed) return;

    tag.goals = [
      {
        id: String(this.nextGoalId++),
        month: parsed.month,
        year: parsed.year,
        value,
      },
    ];
    tag.goalEndsOn = endsOn ? monthStartIso(yearMonthFromIso(endsOn)?.year ?? parsed.year, yearMonthFromIso(endsOn)?.month ?? parsed.month) : null;
  }

  private async create(route: Route) {
    const payload = (await route.request().postDataJSON()) as { tag?: TagAttrs };
    const name = payload.tag?.name?.trim() ?? '';
    const color = payload.tag?.color?.trim() ?? '';
    const goalStartsOn = payloadString(payload.tag?.goal_starts_on ?? payload.tag?.goalStartsOn);
    const goalValue = payload.tag?.goal_value ?? payload.tag?.goalValue;
    const goalEndsOn = payload.tag?.goal_ends_on ?? payload.tag?.goalEndsOn;

    if (!name) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ["can't be blank"] } }, 422);
    }

    if (this.tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
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

    const tag: TagRecord = {
      id: String(this.nextId++),
      name,
      color: color || '#000000',
      active: true,
      goalEndsOn: null,
      goals: [],
    };

    if (goalStartsOn && goalValue != null) {
      this.startGoal(tag, goalStartsOn, goalValue, typeof goalEndsOn === 'string' ? goalEndsOn : null);
    }

    this.tags.push(tag);

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Tag was successfully created.',
      data: tagResource(tag),
    });
  }

  private show(route: Route, id: string) {
    const tag = this.find(id);

    if (!tag) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      data: tagResource(tag),
    });
  }

  private async update(route: Route, id: string) {
    const tag = this.find(id);

    if (!tag) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    const payload = (await route.request().postDataJSON()) as { tag?: TagAttrs };
    const goalStartsOn = payloadString(payload.tag?.goal_starts_on ?? payload.tag?.goalStartsOn);
    const goalValue = payload.tag?.goal_value ?? payload.tag?.goalValue;
    const goalEndsOn = payload.tag?.goal_ends_on ?? payload.tag?.goalEndsOn;

    tag.name = payload.tag?.name?.trim() ?? tag.name;
    tag.color = payload.tag?.color?.trim() ?? tag.color;
    tag.active = payload.tag?.active ?? tag.active;

    if (goalStartsOn || goalValue != null) {
      if (tag.goals?.length) {
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

      this.startGoal(tag, goalStartsOn, goalValue, typeof goalEndsOn === 'string' ? goalEndsOn : tag.goalEndsOn);
    } else if (typeof goalEndsOn === 'string') {
      const parsed = yearMonthFromIso(goalEndsOn);
      tag.goalEndsOn = parsed ? monthStartIso(parsed.year, parsed.month) : tag.goalEndsOn;
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Tag was successfully updated.',
      data: tagResource(tag),
    });
  }

  private async updateGoal(route: Route, id: string) {
    const tag = this.find(id);

    if (!tag) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    const payload = (await route.request().postDataJSON()) as { tag_goal?: GoalAttrs; tagGoal?: GoalAttrs };
    const attrs = payload.tag_goal ?? payload.tagGoal ?? {};
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
    const endsOn = yearMonthFromIso(tag.goalEndsOn);

    if (endsOn && startsTotal > yearMonthTotal(endsOn.year, endsOn.month)) {
      return fulfillJson(
        route,
        { status: 'error', message: 'Validation failed', details: { starts_on: ['must be on or before goal_ends_on'] } },
        422,
      );
    }

    const goals = normalizeGoals(tag.goals);
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
      tag.goals = normalizeGoals(goals).filter((goal) => yearMonthTotal(goal.year, goal.month) <= startsTotal);
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

      tag.goals = normalizeGoals(goals);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Goal created or updated successfully',
      data: tagResource(tag),
    });
  }

  private destroy(route: Route, id: string) {
    const tag = this.find(id);

    if (!tag) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    this.tags = this.tags.filter((item) => tag.id !== item.id);

    return fulfillJson(route, {
      status: 'success',
      message: 'Tag was successfully deleted.',
    });
  }
}

export async function mockTagsApi(page: Page, tags = new TagsApi()) {
  await page.route(/\/api\/v1\/tags(\/|\?|$)/, (route) => tags.handle(route));

  return tags;
}
