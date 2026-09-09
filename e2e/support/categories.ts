import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type CategoryRecord = {
  id: string;
  name: string;
  color: string;
  active: boolean;
};

export const defaultCategories: CategoryRecord[] = [
  { id: '1', name: 'Food', color: '#ff0000', active: true },
  { id: '2', name: 'Transport', color: '#00ff00', active: true },
  { id: '3', name: 'Archive', color: '#0000ff', active: false },
];

type SortEntry = { field: 'name' | 'active'; direction: 'asc' | 'desc' };

function categoryResource(category: CategoryRecord) {
  return {
    id: category.id,
    type: 'category' as const,
    attributes: {
      id: category.id,
      name: category.name,
      color: category.color,
      active: category.active,
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

export class CategoriesApi {
  categories: CategoryRecord[];
  defaultPerPage: number;
  nextId: number;

  constructor(categories: CategoryRecord[] = defaultCategories, defaultPerPage = 25) {
    this.categories = categories.map((category) => ({ ...category }));
    this.defaultPerPage = defaultPerPage;
    this.nextId = categories.reduce((max, category) => Math.max(max, Number(category.id) || 0), 0) + 1;
  }

  find(id: string) {
    return this.categories.find((category) => category.id === id);
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);
    const id = path.match(/\/api\/v1\/categories\/([^/]+)$/)?.[1];

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

  private async create(route: Route) {
    const payload = (await route.request().postDataJSON()) as { category?: { name?: string; color?: string } };
    const name = payload.category?.name?.trim() ?? '';
    const color = payload.category?.color?.trim() ?? '';

    if (!name) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ["can't be blank"] } }, 422);
    }

    if (this.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ['has already been taken'] } }, 422);
    }

    const category: CategoryRecord = {
      id: String(this.nextId++),
      name,
      color: color || '#000000',
      active: true,
    };

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

    const payload = (await route.request().postDataJSON()) as {
      category?: { name?: string; color?: string; active?: boolean };
    };

    category.name = payload.category?.name?.trim() ?? category.name;
    category.color = payload.category?.color?.trim() ?? category.color;
    category.active = payload.category?.active ?? category.active;

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Category was successfully updated.',
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
