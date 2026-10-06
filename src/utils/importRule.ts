import type { ImportRule, ImportRuleCreatePayload, ImportRuleEffectForm, ImportRuleEffectType, ImportRuleForm } from '@/types/import_rule';
import { toCamelKey, toSnakeKey } from '@/utils/case';
import i18n from '@/locales';

type EffectField = 'targetColumn' | 'matchType' | 'pattern' | 'categoryId' | 'tagIds' | 'recurrenceType' | 'installmentsCount' | 'replacement';

// Each effect type only exposes (and sends) the fields it uses, mirroring the API.
export const IMPORT_RULE_EFFECT_FIELDS: Record<ImportRuleEffectType, EffectField[]> = {
  set_category: ['categoryId'],
  add_tags: ['tagIds'],
  set_recurrence_type: ['recurrenceType'],
  set_installments_count: ['installmentsCount', 'pattern'],
  replace_text: ['targetColumn', 'matchType', 'pattern', 'replacement'],
  skip: [],
};

export const IMPORT_RULE_EFFECT_TYPES = Object.keys(IMPORT_RULE_EFFECT_FIELDS) as ImportRuleEffectType[];

export function importRuleEffectHasField(effect: ImportRuleEffectForm, field: EffectField): boolean {
  return effect.effectType !== '' && IMPORT_RULE_EFFECT_FIELDS[effect.effectType].includes(field);
}

export function emptyImportRuleEffect(): ImportRuleEffectForm {
  return {
    effectType: '',
    targetColumn: 'both',
    categoryId: '',
    tagIds: [],
    recurrenceType: '',
    installmentsCount: null,
    matchType: 'contains',
    pattern: '',
    replacement: '',
  };
}

export function applyImportRuleToForm(form: ImportRuleForm, rule: ImportRule): void {
  form.name = rule.name;
  form.position = rule.position;
  form.active = rule.active;
  form.matchType = rule.matchType;
  form.pattern = rule.pattern;
  form.caseSensitive = rule.caseSensitive;
  form.targetColumn = rule.targetColumn;
  form.effects = rule.effects.map((effect) => ({
    effectType: effect.effectType,
    targetColumn: effect.targetColumn,
    categoryId: effect.categoryId ?? '',
    tagIds: [...effect.tagIds],
    recurrenceType: effect.recurrenceType ?? '',
    installmentsCount: effect.installmentsCount,
    matchType: effect.matchType,
    pattern: effect.pattern ?? '',
    replacement: effect.replacement ?? '',
  }));
}

export function importRuleWritePayload(form: ImportRuleForm): ImportRuleCreatePayload {
  const effects = form.effects.map((effect) => {
    const payload: ImportRuleCreatePayload['importRule']['effects'][number] = { effectType: effect.effectType as ImportRuleEffectType };

    if (importRuleEffectHasField(effect, 'targetColumn')) payload.targetColumn = effect.targetColumn;

    if (importRuleEffectHasField(effect, 'categoryId')) payload.categoryId = effect.categoryId;

    if (importRuleEffectHasField(effect, 'tagIds')) payload.tagIds = effect.tagIds;

    if (importRuleEffectHasField(effect, 'matchType')) payload.matchType = effect.matchType;

    // The pattern is optional for set_installments_count, so it is only sent when filled in.
    if (importRuleEffectHasField(effect, 'pattern') && (effect.pattern || effect.effectType === 'replace_text')) payload.pattern = effect.pattern;

    if (importRuleEffectHasField(effect, 'recurrenceType') && effect.recurrenceType) payload.recurrenceType = effect.recurrenceType;

    if (importRuleEffectHasField(effect, 'installmentsCount') && effect.installmentsCount != null)
      payload.installmentsCount = effect.installmentsCount;

    if (importRuleEffectHasField(effect, 'replacement')) payload.replacement = effect.replacement;

    return payload;
  });

  return {
    importRule: {
      name: form.name,
      position: Number(form.position) || 0,
      active: form.active,
      matchType: form.matchType,
      pattern: form.pattern,
      caseSensitive: form.caseSensitive,
      targetColumn: form.targetColumn,
      effects,
    },
  };
}

const EFFECT_ERROR_FIELDS = [
  'effect_type',
  'target_column',
  'category_id',
  'tag_ids',
  'recurrence_type',
  'installments_count',
  'match_type',
  'pattern',
  'replacement',
];

const EFFECT_ERROR_FIELD_PATTERN = new RegExp(`\\b(${EFFECT_ERROR_FIELDS.join('|')})\\b`);

export type ImportRuleEffectErrors = {
  /** Field names (camelCase) with an error, indexed by effect position. */
  byEffect: Record<number, string[]>;
  /** Messages that could not be tied to a specific effect field. */
  general: string[];
};

// The API reports effect errors as messages like "has an invalid or missing category_id in effect 1";
// recover the field and the (1-based) effect position from them.
export function groupImportRuleEffectErrors(messages: string[]): ImportRuleEffectErrors {
  const result: ImportRuleEffectErrors = { byEffect: {}, general: [] };

  for (const message of messages) {
    const field = message.match(EFFECT_ERROR_FIELD_PATTERN)?.[1];
    const position = message.match(/(\d+)\D*$/)?.[1];

    if (!field || !position) {
      result.general.push(message);
      continue;
    }

    const index = Number(position) - 1;

    (result.byEffect[index] ??= []).push(toCamelKey(field));
  }

  return result;
}

// Required fields per effect type, checked before sending (the API validates them again).
const REQUIRED_EFFECT_FIELDS: Record<ImportRuleEffectType, (keyof ImportRuleEffectForm)[]> = {
  set_category: ['categoryId'],
  add_tags: ['tagIds'],
  set_recurrence_type: ['recurrenceType'],
  set_installments_count: [],
  replace_text: ['pattern'],
  skip: [],
};

export function isBlank(value: unknown): boolean {
  return Array.isArray(value) ? value.length === 0 : String(value ?? '').trim() === '';
}

// Messages use the same "<field> ... effect <n>" shape as the API, so groupImportRuleEffectErrors maps both to the effect fields.
export function validateImportRuleEffects(effects: ImportRuleEffectForm[]): string[] {
  if (effects.length === 0) return [i18n.global.t('importRules.errors.effectsRequired')];

  return effects.flatMap((effect, index) => {
    const fields =
      effect.effectType === '' ? (['effectType'] as const) : REQUIRED_EFFECT_FIELDS[effect.effectType].filter((field) => isBlank(effect[field]));

    // set_installments_count needs either a fixed total or a pattern to extract it, never both.
    if (effect.effectType === 'set_installments_count' && effect.installmentsCount == null && isBlank(effect.pattern)) {
      return ['installments_count', 'pattern'].map((field) => `${field} in effect ${index + 1}`);
    }

    return fields.map((field) => `${toSnakeKey(field)} in effect ${index + 1}`);
  });
}
