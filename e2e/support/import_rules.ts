import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type ImportRuleEffectRecord = {
  id: string;
  effectType: 'set_category' | 'add_tags' | 'set_recurrence_type' | 'set_installments_count' | 'replace_text' | 'skip';
  targetColumn?: 'title' | 'description' | 'both';
  categoryId?: string | null;
  tagIds?: string[];
  recurrenceType?: 'one_time' | 'installment' | 'recurring' | null;
  installmentsCount?: number | null;
  matchType?: 'contains' | 'regex';
  pattern?: string | null;
  replacement?: string | null;
};

export type ImportRuleRecord = {
  id: string;
  name: string;
  position: number;
  active: boolean;
  matchType: 'contains' | 'regex';
  pattern: string;
  caseSensitive: boolean;
  targetColumn: 'title' | 'description' | 'both';
  effects: ImportRuleEffectRecord[];
};

export const defaultImportRules: ImportRuleRecord[] = [
  {
    id: '1',
    name: 'Uber rides',
    position: 0,
    active: true,
    matchType: 'contains',
    pattern: 'uber',
    caseSensitive: false,
    targetColumn: 'both',
    effects: [{ id: '1', effectType: 'set_category', categoryId: '2' }],
  },
  {
    id: '2',
    name: 'Skip transfers',
    position: 1,
    active: true,
    matchType: 'regex',
    pattern: '^transfer',
    caseSensitive: false,
    targetColumn: 'title',
    effects: [{ id: '2', effectType: 'skip' }],
  },
  {
    id: '3',
    name: 'Old rule',
    position: 2,
    active: false,
    matchType: 'contains',
    pattern: 'legacy',
    caseSensitive: true,
    targetColumn: 'description',
    effects: [{ id: '3', effectType: 'add_tags', tagIds: ['1'] }],
  },
];

type SortEntry = { field: 'name' | 'position' | 'active'; direction: 'asc' | 'desc' };

type EffectAttrs = {
  effect_type?: ImportRuleEffectRecord['effectType'];
  target_column?: ImportRuleEffectRecord['targetColumn'];
  category_id?: string;
  tag_ids?: string[];
  recurrence_type?: ImportRuleEffectRecord['recurrenceType'];
  installments_count?: number;
  match_type?: ImportRuleEffectRecord['matchType'];
  pattern?: string;
  replacement?: string;
};

type ImportRuleAttrs = {
  name?: string;
  position?: number;
  active?: boolean;
  match_type?: ImportRuleRecord['matchType'];
  pattern?: string;
  case_sensitive?: boolean;
  target_column?: ImportRuleRecord['targetColumn'];
  effects?: EffectAttrs[];
};

function importRuleResource(rule: ImportRuleRecord) {
  return {
    id: rule.id,
    type: 'transaction_import_rule' as const,
    attributes: {
      id: rule.id,
      name: rule.name,
      position: rule.position,
      active: rule.active,
      match_type: rule.matchType,
      pattern: rule.pattern,
      case_sensitive: rule.caseSensitive,
      target_column: rule.targetColumn,
      effects: rule.effects.map((effect, index) => ({
        id: effect.id,
        position: index,
        effect_type: effect.effectType,
        target_column: effect.targetColumn ?? null,
        category_id: effect.categoryId ?? null,
        tag_ids: effect.tagIds ?? [],
        recurrence_type: effect.recurrenceType ?? null,
        installments_count: effect.installmentsCount ?? null,
        match_type: effect.matchType ?? null,
        pattern: effect.pattern ?? null,
        replacement: effect.replacement ?? null,
      })),
    },
  };
}

function parseSort(value: string | null): SortEntry[] {
  if (!value?.trim()) return [];

  const entries: SortEntry[] = [];

  for (const part of value.split(',')) {
    const [field, direction] = part.trim().split(/\s+/);

    if ((field === 'name' || field === 'position' || field === 'active') && (direction === 'asc' || direction === 'desc')) {
      entries.push({ field, direction });
    }
  }

  return entries;
}

function compareRules(left: ImportRuleRecord, right: ImportRuleRecord, sorts: SortEntry[]): number {
  for (const sort of sorts) {
    const leftValue = left[sort.field];
    const rightValue = right[sort.field];

    if (leftValue === rightValue) continue;

    const result = leftValue < rightValue ? -1 : 1;

    return sort.direction === 'asc' ? result : -result;
  }

  return 0;
}

export class ImportRulesApi {
  rules: ImportRuleRecord[];
  defaultPerPage: number;
  nextId: number;
  nextEffectId: number;
  lastPayload: ImportRuleAttrs | null = null;

  constructor(rules: ImportRuleRecord[] = defaultImportRules, defaultPerPage = 25) {
    this.rules = rules.map((rule) => ({ ...rule, effects: rule.effects.map((effect) => ({ ...effect })) }));
    this.defaultPerPage = defaultPerPage;
    this.nextId = rules.reduce((max, rule) => Math.max(max, Number(rule.id) || 0), 0) + 1;
    this.nextEffectId = rules.reduce((max, rule) => Math.max(max, ...rule.effects.map((effect) => Number(effect.id) || 0)), 0) + 1;
  }

  find(id: string) {
    return this.rules.find((rule) => rule.id === id);
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const id = apiPath(url).match(/\/api\/v1\/transactions\/import_rules\/([^/]+)$/)?.[1];

    if (!id && method === 'GET') return this.list(route, apiSearch(url));

    if (!id && method === 'POST') return this.create(route);

    if (id && method === 'GET') return this.show(route, id);

    if (id && method === 'PATCH') return this.update(route, id);

    if (id && method === 'DELETE') return this.destroy(route, id);

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }

  private list(route: Route, search: URLSearchParams) {
    const nameCont = search.get('q[name_cont]')?.trim().toLowerCase();
    const activeEq = search.get('q[active_eq]');
    const sorts = parseSort(search.get('sort'));
    const perPage = Number(search.get('per_page') ?? this.defaultPerPage);
    const page = Number(search.get('page') ?? 1);
    let items = [...this.rules];

    if (nameCont) items = items.filter((rule) => rule.name.toLowerCase().includes(nameCont));

    if (activeEq === 'true' || activeEq === 'false') {
      const active = activeEq === 'true';
      items = items.filter((rule) => rule.active === active);
    }

    items.sort((left, right) => compareRules(left, right, sorts.length ? sorts : [{ field: 'position', direction: 'asc' }]));

    const pages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
    const offset = (currentPage - 1) * perPage;

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: items.slice(offset, offset + perPage).map(importRuleResource),
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

  private effectsFromPayload(effects: EffectAttrs[] = []): ImportRuleEffectRecord[] {
    return effects.map((effect) => ({
      id: String(this.nextEffectId++),
      effectType: effect.effect_type as ImportRuleEffectRecord['effectType'],
      targetColumn: effect.target_column,
      categoryId: effect.category_id ?? null,
      tagIds: effect.tag_ids ?? [],
      recurrenceType: effect.recurrence_type ?? null,
      installmentsCount: effect.installments_count ?? null,
      matchType: effect.match_type,
      pattern: effect.pattern ?? null,
      replacement: effect.replacement ?? null,
    }));
  }

  private validate(route: Route, attrs: ImportRuleAttrs | undefined) {
    const details: Record<string, string[]> = {};

    if (!attrs?.name?.trim()) details.name = ["can't be blank"];

    if (!attrs?.pattern?.trim()) details.pattern = ["can't be blank"];

    if (!attrs?.effects?.length) details.effects = ['must have at least one effect'];

    if (Object.keys(details).length === 0) return null;

    return fulfillJson(route, { status: 'error', message: 'Validation failed', details }, 422);
  }

  private async create(route: Route) {
    const payload = (await route.request().postDataJSON()) as { import_rule?: ImportRuleAttrs };
    const attrs = payload.import_rule;
    const invalid = this.validate(route, attrs);

    if (invalid) return invalid;

    this.lastPayload = attrs ?? null;

    const rule: ImportRuleRecord = {
      id: String(this.nextId++),
      name: attrs?.name?.trim() ?? '',
      position: attrs?.position ?? 0,
      active: attrs?.active ?? true,
      matchType: attrs?.match_type ?? 'contains',
      pattern: attrs?.pattern ?? '',
      caseSensitive: attrs?.case_sensitive ?? false,
      targetColumn: attrs?.target_column ?? 'both',
      effects: this.effectsFromPayload(attrs?.effects),
    };

    this.rules.push(rule);

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Import rule was successfully created.',
      data: importRuleResource(rule),
    });
  }

  private show(route: Route, id: string) {
    const rule = this.find(id);

    if (!rule) return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);

    return fulfillJson(route, { status: 'success', type: 'object', data: importRuleResource(rule) });
  }

  private async update(route: Route, id: string) {
    const rule = this.find(id);

    if (!rule) return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);

    const payload = (await route.request().postDataJSON()) as { import_rule?: ImportRuleAttrs };
    const attrs = payload.import_rule;
    const invalid = this.validate(route, attrs);

    if (invalid) return invalid;

    this.lastPayload = attrs ?? null;

    rule.name = attrs?.name?.trim() ?? rule.name;
    rule.position = attrs?.position ?? rule.position;
    rule.active = attrs?.active ?? rule.active;
    rule.matchType = attrs?.match_type ?? rule.matchType;
    rule.pattern = attrs?.pattern ?? rule.pattern;
    rule.caseSensitive = attrs?.case_sensitive ?? rule.caseSensitive;
    rule.targetColumn = attrs?.target_column ?? rule.targetColumn;
    rule.effects = this.effectsFromPayload(attrs?.effects);

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Import rule was successfully updated.',
      data: importRuleResource(rule),
    });
  }

  private destroy(route: Route, id: string) {
    const rule = this.find(id);

    if (!rule) return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);

    this.rules = this.rules.filter((item) => item.id !== rule.id);

    return fulfillJson(route, { status: 'success', message: 'Import rule was successfully deleted.' });
  }
}

export async function mockImportRulesApi(page: Page, importRules = new ImportRulesApi()) {
  await page.route(/\/api\/v1\/transactions\/import_rules(\/|\?|$)/, (route) => importRules.handle(route));

  return importRules;
}
