import type { ColorOption } from '@/components/inputs/ColorSelect.vue';
import type { TransactionImportConfirmRow, TransactionImportPreviewRow } from '@/types/transaction';

// Categories/tags that do not exist yet are selectable by name; the API creates them on import.
const NEW_PREFIX = 'new:';

export const MAX_IMPORT_ROWS = 1000;

// Data rows of a CSV: non-empty lines minus the header.
export async function countCsvRows(file: File): Promise<number> {
  const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim() !== '');

  return Math.max(0, lines.length - 1);
}

export type TransactionImportRowForm = {
  row: number;
  create: boolean;
  sourceKey: string;
  date: string | null;
  description: string;
  amount: number | null;
  recurrenceType: string;
  endsOn: string | null;
  categoryKey: string;
  tagKeys: string[];
  kind: TransactionImportPreviewRow['kind'];
  paymentMethod: TransactionImportPreviewRow['paymentMethod'];
  accountId: string | null;
  creditCardId: string | null;
  limitConsumptionType: string;
  installmentsCount: number | null;
};

const DEFAULT_LIMIT_CONSUMPTION_TYPE = 'upfront';
const DEFAULT_INSTALLMENTS_COUNT = 2;

function optionKey(entity: { id?: string; name: string }): string {
  return entity.id ?? `${NEW_PREFIX}${entity.name}`;
}

function isNewKey(key: string): boolean {
  return key.startsWith(NEW_PREFIX);
}

function splitKeys(keys: string[]): { ids: string[]; names: string[] } {
  return {
    ids: keys.filter((key) => !isNewKey(key)),
    names: keys.filter(isNewKey).map((key) => key.slice(NEW_PREFIX.length)),
  };
}

// Changing the recurrence type resets the dependent fields; installments get their defaults back.
export function resetRecurrenceFields(row: TransactionImportRowForm): void {
  const installment = row.recurrenceType === 'installment';

  row.limitConsumptionType = installment ? DEFAULT_LIMIT_CONSUMPTION_TYPE : '';
  row.installmentsCount = installment ? DEFAULT_INSTALLMENTS_COUNT : null;
  row.endsOn = null;
}

export function rowFormFromPreview(row: TransactionImportPreviewRow): TransactionImportRowForm {
  const installment = row.recurrenceType === 'installment';

  return {
    row: row.row,
    create: true,
    sourceKey: row.sourceKey,
    date: row.date,
    description: row.description,
    amount: Number(row.amount),
    recurrenceType: row.recurrenceType,
    endsOn: installment ? null : row.endsOn,
    categoryKey: row.category ? optionKey(row.category) : '',
    tagKeys: row.tags.map(optionKey),
    kind: row.kind,
    paymentMethod: row.paymentMethod,
    accountId: row.accountId,
    creditCardId: row.creditCardId,
    limitConsumptionType: row.limitConsumptionType ?? (installment ? DEFAULT_LIMIT_CONSUMPTION_TYPE : ''),
    installmentsCount: installment ? (row.installmentsCount ?? DEFAULT_INSTALLMENTS_COUNT) : null,
  };
}

// Adds a "new" option for every category/tag name that came from the CSV and is not registered yet.
export function newOptionsFromPreview(rows: TransactionImportPreviewRow[], pick: 'category' | 'tags'): ColorOption[] {
  const entities = rows.flatMap((row) => (pick === 'category' ? (row.category ? [row.category] : []) : row.tags));
  const unique = new Map(entities.filter((entity) => entity.new).map((entity) => [optionKey(entity).toLowerCase(), entity]));

  return [...unique.values()].map((entity) => ({ key: optionKey(entity), label: entity.name }));
}

export function isInstallmentInvalid(row: TransactionImportRowForm): boolean {
  return row.recurrenceType === 'installment' && (!row.limitConsumptionType || (row.installmentsCount ?? 0) <= 1);
}

export function isRowValid(row: TransactionImportRowForm): boolean {
  return !row.create || (Boolean(row.date && row.description.trim() && row.amount != null && row.categoryKey) && !isInstallmentInvalid(row));
}

export function confirmRowFromForm(row: TransactionImportRowForm): TransactionImportConfirmRow {
  const category = row.categoryKey ? splitKeys([row.categoryKey]) : { ids: [], names: [] };
  const tags = splitKeys(row.tagKeys);

  return {
    row: row.row,
    create: row.create,
    sourceKey: row.sourceKey,
    date: row.date ?? '',
    description: row.description,
    amount: (row.amount ?? 0).toFixed(2),
    kind: row.kind,
    paymentMethod: row.paymentMethod,
    accountId: row.accountId ?? undefined,
    creditCardId: row.creditCardId ?? undefined,
    limitConsumptionType: (row.limitConsumptionType || undefined) as TransactionImportConfirmRow['limitConsumptionType'],
    installmentsCount: row.installmentsCount ?? undefined,
    recurrenceType: row.recurrenceType as TransactionImportConfirmRow['recurrenceType'],
    endsOn: row.endsOn ?? undefined,
    categoryId: category.ids[0],
    categoryName: category.names[0],
    tagIds: tags.ids,
    tagNames: tags.names,
  };
}
