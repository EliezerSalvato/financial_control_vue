import type {
  ImportRule,
  ImportRuleAttributesApi,
  ImportRuleCollectionResponseApi,
  ImportRuleCreateResponseApi,
  ImportRuleCreateResult,
  ImportRuleEffect,
  ImportRuleEffectAttributesApi,
  ImportRuleListResult,
  ImportRuleResourceItemApi,
  ImportRuleShowResult,
  ImportRuleSuccessResponseApi,
  ImportRuleUpdateResult,
} from '@/types/import_rule';
import { collectionFromApi, createResultFromApi, resourceId } from '@/transformers/jsonApi';
import { keysToCamelCase } from '@/utils/case';

function effectFromApi(effect: ImportRuleEffectAttributesApi): ImportRuleEffect {
  return {
    id: effect.id,
    effectType: effect.effectType,
    targetColumn: effect.targetColumn ?? 'both',
    categoryId: effect.categoryId ?? null,
    tagIds: effect.tagIds ?? [],
    recurrenceType: effect.recurrenceType ?? null,
    installmentsCount: effect.installmentsCount ?? null,
    matchType: effect.matchType ?? 'contains',
    pattern: effect.pattern ?? null,
    replacement: effect.replacement ?? null,
  };
}

export function importRuleFromResource(resource: ImportRuleResourceItemApi): ImportRule {
  const attributes = keysToCamelCase<ImportRuleAttributesApi>(resource.attributes);

  return {
    id: resourceId(attributes, resource),
    name: attributes.name,
    position: attributes.position,
    active: attributes.active,
    matchType: attributes.matchType,
    pattern: attributes.pattern,
    caseSensitive: attributes.caseSensitive,
    targetColumn: attributes.targetColumn,
    effects: (attributes.effects ?? []).map(effectFromApi),
  };
}

export function importRuleCollectionFromApi(response: ImportRuleCollectionResponseApi): ImportRuleListResult {
  return collectionFromApi(response, importRuleFromResource, 'importRules');
}

export function importRuleCreateFromApi(response: ImportRuleCreateResponseApi): ImportRuleCreateResult {
  return createResultFromApi(response, importRuleFromResource, 'importRule');
}

export function importRuleUpdateFromApi(response: ImportRuleCreateResponseApi): ImportRuleUpdateResult {
  return importRuleCreateFromApi(response);
}

export function importRuleShowFromApi(response: ImportRuleSuccessResponseApi): ImportRuleShowResult {
  return importRuleFromResource(response.data);
}
