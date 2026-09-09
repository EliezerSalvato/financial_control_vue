import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type TagRecord = {
  id: string;
  name: string;
  color: string;
  active: boolean;
};

export const defaultTags: TagRecord[] = [
  { id: '1', name: 'Work', color: '#ff0000', active: true },
  { id: '2', name: 'Home', color: '#00ff00', active: true },
  { id: '3', name: 'Archive', color: '#0000ff', active: false },
];

type SortEntry = { field: 'name' | 'active'; direction: 'asc' | 'desc' };

function tagResource(tag: TagRecord) {
  return {
    id: tag.id,
    type: 'tag' as const,
    attributes: {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      active: tag.active,
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

export class TagsApi {
  tags: TagRecord[];
  defaultPerPage: number;
  nextId: number;

  constructor(tags: TagRecord[] = defaultTags, defaultPerPage = 25) {
    this.tags = tags.map((tag) => ({ ...tag }));
    this.defaultPerPage = defaultPerPage;
    this.nextId = tags.reduce((max, tag) => Math.max(max, Number(tag.id) || 0), 0) + 1;
  }

  find(id: string) {
    return this.tags.find((tag) => tag.id === id);
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);
    const id = path.match(/\/api\/v1\/tags\/([^/]+)$/)?.[1];

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

  private async create(route: Route) {
    const payload = (await route.request().postDataJSON()) as { tag?: { name?: string; color?: string } };
    const name = payload.tag?.name?.trim() ?? '';
    const color = payload.tag?.color?.trim() ?? '';

    if (!name) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ["can't be blank"] } }, 422);
    }

    if (this.tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ['has already been taken'] } }, 422);
    }

    const tag: TagRecord = {
      id: String(this.nextId++),
      name,
      color: color || '#000000',
      active: true,
    };

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

    const payload = (await route.request().postDataJSON()) as {
      tag?: { name?: string; color?: string; active?: boolean };
    };

    tag.name = payload.tag?.name?.trim() ?? tag.name;
    tag.color = payload.tag?.color?.trim() ?? tag.color;
    tag.active = payload.tag?.active ?? tag.active;

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Tag was successfully updated.',
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
