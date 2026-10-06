import type {
  JsonApiCollectionResponse,
  JsonApiCreateResponse,
  JsonApiObjectResponse,
  JsonApiResource,
  ListParams,
  MutationResult,
  PaginatedListResult,
} from '@/types/api';

export type ImportRuleMatchType = 'contains' | 'regex';
export type ImportRuleTargetColumn = 'title' | 'description' | 'both';
export type ImportRuleEffectType = 'set_category' | 'add_tags' | 'set_recurrence_type' | 'set_installments_count' | 'replace_text' | 'skip';
export type ImportRuleRecurrenceType = 'one_time' | 'installment' | 'recurring';

export type ImportRuleEffect = {
  id: string;
  effectType: ImportRuleEffectType;
  targetColumn: ImportRuleTargetColumn;
  categoryId: string | null;
  tagIds: string[];
  recurrenceType: ImportRuleRecurrenceType | null;
  installmentsCount: number | null;
  matchType: ImportRuleMatchType;
  pattern: string | null;
  replacement: string | null;
};

export type ImportRule = {
  id: string;
  name: string;
  position: number;
  active: boolean;
  matchType: ImportRuleMatchType;
  pattern: string;
  caseSensitive: boolean;
  targetColumn: ImportRuleTargetColumn;
  effects: ImportRuleEffect[];
};

export type ImportRuleEffectAttributesApi = {
  id: string;
  position: number;
  effectType: ImportRuleEffectType;
  targetColumn?: ImportRuleTargetColumn | null;
  categoryId?: string | null;
  tagIds?: string[] | null;
  recurrenceType?: ImportRuleRecurrenceType | null;
  installmentsCount?: number | null;
  matchType?: ImportRuleMatchType | null;
  pattern?: string | null;
  replacement?: string | null;
};

export type ImportRuleAttributesApi = {
  id: string;
  name: string;
  position: number;
  active: boolean;
  matchType: ImportRuleMatchType;
  pattern: string;
  caseSensitive: boolean;
  targetColumn: ImportRuleTargetColumn;
  effects?: ImportRuleEffectAttributesApi[];
};

export type ImportRuleResourceItemApi = JsonApiResource<'transaction_import_rule', ImportRuleAttributesApi>;

export type ImportRuleCollectionResponseApi = JsonApiCollectionResponse<ImportRuleResourceItemApi>;

export type ImportRuleListFilters = {
  nameCont?: string;
  activeEq?: boolean;
};

export type ImportRuleListParams = ListParams<ImportRuleListFilters>;

export type ImportRuleListResult = PaginatedListResult<'importRules', ImportRule>;

export type ImportRuleEffectForm = {
  effectType: ImportRuleEffectType | '';
  targetColumn: ImportRuleTargetColumn;
  categoryId: string;
  tagIds: string[];
  recurrenceType: ImportRuleRecurrenceType | '';
  installmentsCount: number | null;
  matchType: ImportRuleMatchType;
  pattern: string;
  replacement: string;
};

export type ImportRuleForm = {
  name: string;
  position: number;
  active: boolean;
  matchType: ImportRuleMatchType;
  pattern: string;
  caseSensitive: boolean;
  targetColumn: ImportRuleTargetColumn;
  effects: ImportRuleEffectForm[];
};

export type ImportRuleCreatePayload = {
  importRule: Omit<ImportRuleForm, 'effects'> & {
    effects: Array<{
      effectType: ImportRuleEffectType;
      targetColumn?: ImportRuleTargetColumn;
      categoryId?: string;
      tagIds?: string[];
      recurrenceType?: ImportRuleRecurrenceType;
      installmentsCount?: number;
      matchType?: ImportRuleMatchType;
      pattern?: string;
      replacement?: string;
    }>;
  };
};

export type ImportRuleUpdatePayload = ImportRuleCreatePayload;

export type ImportRuleCreateResponseApi = JsonApiCreateResponse<ImportRuleResourceItemApi>;

export type ImportRuleCreateResult = MutationResult<'importRule', ImportRule>;

export type ImportRuleUpdateResult = ImportRuleCreateResult;

export type ImportRuleSuccessResponseApi = JsonApiObjectResponse<ImportRuleResourceItemApi>;

export type ImportRuleShowResult = ImportRule;
