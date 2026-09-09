import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type InstitutionRecord = {
  id: string;
  name: string;
  logoKey: string;
  active: boolean;
};

export const defaultInstitutions: InstitutionRecord[] = [
  { id: '1', name: 'Nubank', logoKey: 'nu-bank', active: true },
  { id: '2', name: 'Itau', logoKey: 'itau', active: true },
  { id: '3', name: 'Archive', logoKey: 'generic', active: false },
];

type SortEntry = { field: 'name' | 'active'; direction: 'asc' | 'desc' };

type InstitutionPayload = {
  institution?: {
    name?: string;
    logo_key?: string;
    logoKey?: string;
    active?: boolean;
  };
};

function institutionResource(institution: InstitutionRecord) {
  return {
    id: institution.id,
    type: 'institution' as const,
    attributes: {
      id: institution.id,
      name: institution.name,
      logoKey: institution.logoKey,
      active: institution.active,
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

function compareInstitutions(left: InstitutionRecord, right: InstitutionRecord, sorts: SortEntry[]): number {
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

function payloadLogoKey(payload: InstitutionPayload): string {
  return (payload.institution?.logo_key ?? payload.institution?.logoKey)?.trim() ?? '';
}

export class InstitutionsApi {
  institutions: InstitutionRecord[];
  defaultPerPage: number;
  nextId: number;

  constructor(institutions: InstitutionRecord[] = defaultInstitutions, defaultPerPage = 25) {
    this.institutions = institutions.map((institution) => ({ ...institution }));
    this.defaultPerPage = defaultPerPage;
    this.nextId = institutions.reduce((max, institution) => Math.max(max, Number(institution.id) || 0), 0) + 1;
  }

  find(id: string) {
    return this.institutions.find((institution) => institution.id === id);
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);
    const id = path.match(/\/api\/v1\/institutions\/([^/]+)$/)?.[1];

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

    let items = [...this.institutions];

    if (nameCont) {
      items = items.filter((institution) => institution.name.toLowerCase().includes(nameCont));
    }

    if (activeEq === 'true' || activeEq === 'false') {
      const active = activeEq === 'true';
      items = items.filter((institution) => institution.active === active);
    }

    if (sorts.length) {
      items.sort((left, right) => compareInstitutions(left, right, sorts));
    }

    const pages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
    const offset = (currentPage - 1) * perPage;
    const pageItems = items.slice(offset, offset + perPage);

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: pageItems.map(institutionResource),
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
    const payload = (await route.request().postDataJSON()) as InstitutionPayload;
    const name = payload.institution?.name?.trim() ?? '';
    const logoKey = payloadLogoKey(payload);

    if (!name) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ["can't be blank"] } }, 422);
    }

    if (!logoKey) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { logo_key: ["can't be blank"] } }, 422);
    }

    if (this.institutions.some((institution) => institution.name.toLowerCase() === name.toLowerCase())) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ['has already been taken'] } }, 422);
    }

    const institution: InstitutionRecord = {
      id: String(this.nextId++),
      name,
      logoKey,
      active: true,
    };

    this.institutions.push(institution);

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Institution was successfully created.',
      data: institutionResource(institution),
    });
  }

  private show(route: Route, id: string) {
    const institution = this.find(id);

    if (!institution) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      data: institutionResource(institution),
    });
  }

  private async update(route: Route, id: string) {
    const institution = this.find(id);

    if (!institution) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    const payload = (await route.request().postDataJSON()) as InstitutionPayload;

    institution.name = payload.institution?.name?.trim() ?? institution.name;
    institution.logoKey = payloadLogoKey(payload) || institution.logoKey;
    institution.active = payload.institution?.active ?? institution.active;

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Institution was successfully updated.',
      data: institutionResource(institution),
    });
  }

  private destroy(route: Route, id: string) {
    const institution = this.find(id);

    if (!institution) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    this.institutions = this.institutions.filter((item) => institution.id !== item.id);

    return fulfillJson(route, {
      status: 'success',
      message: 'Institution was successfully deleted.',
    });
  }
}

export async function mockInstitutionsApi(page: Page, institutions = new InstitutionsApi()) {
  await page.route(/\/api\/v1\/institutions(\/|\?|$)/, (route) => institutions.handle(route));

  return institutions;
}
