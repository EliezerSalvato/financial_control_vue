import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type TransactionKind = 'income' | 'expense' | 'transfer_between_accounts';
export type TransactionStatus = 'pending' | 'active' | 'completed' | 'canceled';
export type TransactionPaymentMethod = 'pix' | 'debit' | 'credit_card' | 'ted' | 'doc' | 'deposit' | 'cash' | 'boleto';
export type TransactionRecurrenceType = 'one_time' | 'installment' | 'recurring';
export type LimitConsumptionType = 'upfront' | 'monthly';

export type TransactionRecurrenceRecord = {
  id: string;
  startsOn: string;
  value: number;
  changeForNextMonths?: boolean;
};

export type TransactionRecord = {
  id: string;
  categoryId: string | null;
  description: string;
  kind: TransactionKind;
  status: TransactionStatus;
  paymentMethod: TransactionPaymentMethod | null;
  recurrenceType: TransactionRecurrenceType;
  installmentsCount: number | null;
  endsOn: string | null;
  accountId: string | null;
  creditCardId: string | null;
  limitConsumptionType: LimitConsumptionType | null;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  tagIds: string[];
  recurrences: TransactionRecurrenceRecord[];
  currentValue: number;
  createdAt: string;
};

export type SettledTransactionRecord = {
  id: string;
  transactionId: string;
  categoryId: string | null;
  description: string;
  kind: TransactionKind;
  status: TransactionStatus;
  paymentMethod: TransactionPaymentMethod | null;
  recurrenceType: TransactionRecurrenceType;
  installmentsCount: number | null;
  endsOn: string | null;
  canceledOn: string | null;
  occurredOn: string;
  settledOn: string;
  value: number;
  installmentNumber: number | null;
  accountId: string | null;
  creditCardId: string | null;
  limitConsumptionType: LimitConsumptionType | null;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
};

export const defaultTransactions: TransactionRecord[] = [
  {
    id: '1',
    categoryId: '2',
    description: 'Salary',
    kind: 'income',
    status: 'pending',
    paymentMethod: 'deposit',
    recurrenceType: 'one_time',
    installmentsCount: null,
    endsOn: null,
    accountId: '1',
    creditCardId: null,
    limitConsumptionType: null,
    sourceAccountId: null,
    destinationAccountId: null,
    tagIds: ['1'],
    recurrences: [{ id: '1-r1', startsOn: '2026-03-01', value: 5000 }],
    currentValue: 5000,
    createdAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: '2',
    categoryId: '1',
    description: 'Groceries',
    kind: 'expense',
    status: 'pending',
    paymentMethod: 'pix',
    recurrenceType: 'one_time',
    installmentsCount: null,
    endsOn: null,
    accountId: '1',
    creditCardId: null,
    limitConsumptionType: null,
    sourceAccountId: null,
    destinationAccountId: null,
    tagIds: ['2'],
    recurrences: [{ id: '2-r1', startsOn: '2026-03-05', value: 85.5 }],
    currentValue: 85.5,
    createdAt: '2026-03-05T10:00:00.000Z',
  },
  {
    id: '3',
    categoryId: '1',
    description: 'Utilities',
    kind: 'expense',
    status: 'active',
    paymentMethod: 'pix',
    recurrenceType: 'recurring',
    installmentsCount: null,
    endsOn: null,
    accountId: '1',
    creditCardId: null,
    limitConsumptionType: null,
    sourceAccountId: null,
    destinationAccountId: null,
    tagIds: [],
    recurrences: [{ id: '3-r1', startsOn: '2026-01-01', value: 1200 }],
    currentValue: 1200,
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: '4',
    categoryId: '1',
    description: 'Netflix',
    kind: 'expense',
    status: 'completed',
    paymentMethod: 'credit_card',
    recurrenceType: 'installment',
    installmentsCount: 12,
    endsOn: '2025-12-01',
    accountId: null,
    creditCardId: '1',
    limitConsumptionType: 'monthly',
    sourceAccountId: null,
    destinationAccountId: null,
    tagIds: [],
    recurrences: [{ id: '4-r1', startsOn: '2025-01-01', value: 45.9 }],
    currentValue: 45.9,
    createdAt: '2025-01-01T10:00:00.000Z',
  },
];

type SortField = 'description' | 'kind' | 'status' | 'payment_method' | 'recurrence_type' | 'created_at';
type SortEntry = { field: SortField; direction: 'asc' | 'desc' };

type TransactionAttrs = {
  description?: string;
  kind?: string;
  payment_method?: string;
  paymentMethod?: string;
  recurrence_type?: string;
  recurrenceType?: string;
  starts_on?: string;
  startsOn?: string;
  ends_on?: string | null;
  endsOn?: string | null;
  value?: number;
  category_id?: string;
  categoryId?: string;
  account_id?: string | null;
  accountId?: string | null;
  credit_card_id?: string | null;
  creditCardId?: string | null;
  limit_consumption_type?: string | null;
  limitConsumptionType?: string | null;
  source_account_id?: string | null;
  sourceAccountId?: string | null;
  destination_account_id?: string | null;
  destinationAccountId?: string | null;
  tag_ids?: string[];
  tagIds?: string[];
};

type RecurrenceAttrs = {
  value?: number;
  starts_on?: string;
  startsOn?: string;
  change_for_next_months?: boolean;
  changeForNextMonths?: boolean;
};

const KINDS = new Set<TransactionKind>(['income', 'expense', 'transfer_between_accounts']);
const STATUSES = new Set<TransactionStatus>(['pending', 'active', 'completed', 'canceled']);
const PAYMENT_METHODS = new Set<TransactionPaymentMethod>(['pix', 'debit', 'credit_card', 'ted', 'doc', 'deposit', 'cash', 'boleto']);
const RECURRENCE_TYPES = new Set<TransactionRecurrenceType>(['one_time', 'installment', 'recurring']);
const LIMIT_CONSUMPTION_TYPES = new Set<LimitConsumptionType>(['upfront', 'monthly']);

function isKind(value: string): value is TransactionKind {
  return KINDS.has(value as TransactionKind);
}

function isStatus(value: string): value is TransactionStatus {
  return STATUSES.has(value as TransactionStatus);
}

function isPaymentMethod(value: string): value is TransactionPaymentMethod {
  return PAYMENT_METHODS.has(value as TransactionPaymentMethod);
}

function isRecurrenceType(value: string): value is TransactionRecurrenceType {
  return RECURRENCE_TYPES.has(value as TransactionRecurrenceType);
}

function isLimitConsumptionType(value: string): value is LimitConsumptionType {
  return LIMIT_CONSUMPTION_TYPES.has(value as LimitConsumptionType);
}

function recurrenceResource(recurrence: TransactionRecurrenceRecord) {
  return {
    id: recurrence.id,
    type: 'transaction_recurrence' as const,
    attributes: {
      id: recurrence.id,
      startsOn: recurrence.startsOn,
      value: recurrence.value,
    },
  };
}

function settledResource(settled: SettledTransactionRecord) {
  return {
    id: settled.id,
    type: 'settled_transaction' as const,
    attributes: {
      id: settled.id,
      transactionId: settled.transactionId,
      categoryId: settled.categoryId,
      description: settled.description,
      kind: settled.kind,
      status: settled.status,
      paymentMethod: settled.paymentMethod,
      recurrenceType: settled.recurrenceType,
      installmentsCount: settled.installmentsCount,
      endsOn: settled.endsOn,
      canceledOn: settled.canceledOn,
      occurredOn: settled.occurredOn,
      settledOn: settled.settledOn,
      value: settled.value,
      installmentNumber: settled.installmentNumber,
      accountId: settled.accountId,
      creditCardId: settled.creditCardId,
      limitConsumptionType: settled.limitConsumptionType,
      sourceAccountId: settled.sourceAccountId,
      destinationAccountId: settled.destinationAccountId,
    },
  };
}

function yearMonthFromIso(iso: string): { month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  const year = match ? Number(match[1]) : NaN;
  const month = match ? Number(match[2]) : NaN;

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { month, year };
}

function transactionResource(transaction: TransactionRecord) {
  return {
    id: transaction.id,
    type: 'transaction' as const,
    attributes: {
      id: transaction.id,
      categoryId: transaction.categoryId,
      description: transaction.description,
      kind: transaction.kind,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      recurrenceType: transaction.recurrenceType,
      installmentsCount: transaction.installmentsCount,
      endsOn: transaction.endsOn,
      accountId: transaction.accountId,
      creditCardId: transaction.creditCardId,
      limitConsumptionType: transaction.limitConsumptionType,
      sourceAccountId: transaction.sourceAccountId,
      destinationAccountId: transaction.destinationAccountId,
      tagIds: transaction.tagIds,
      recurrences: [...transaction.recurrences].sort((left, right) => left.startsOn.localeCompare(right.startsOn)).map(recurrenceResource),
      currentValue: transaction.currentValue,
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

    if (
      (field === 'description' ||
        field === 'kind' ||
        field === 'status' ||
        field === 'payment_method' ||
        field === 'recurrence_type' ||
        field === 'created_at') &&
      (direction === 'asc' || direction === 'desc')
    ) {
      entries.push({ field, direction });
    }
  }

  return entries;
}

function sortValue(transaction: TransactionRecord, field: SortField): string | number {
  if (field === 'payment_method') {
    return transaction.paymentMethod ?? '';
  }

  if (field === 'recurrence_type') {
    return transaction.recurrenceType;
  }

  if (field === 'created_at') {
    return transaction.createdAt;
  }

  return transaction[field];
}

function compareTransactions(left: TransactionRecord, right: TransactionRecord, sorts: SortEntry[]): number {
  for (const sort of sorts) {
    const leftValue = sortValue(left, sort.field);
    const rightValue = sortValue(right, sort.field);

    if (leftValue === rightValue) {
      continue;
    }

    const result = leftValue < rightValue ? -1 : 1;

    return sort.direction === 'asc' ? result : -result;
  }

  return 0;
}

function payloadTransaction(payload: { transaction?: TransactionAttrs }): TransactionAttrs {
  return payload.transaction ?? {};
}

function payloadString(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function payloadTags(attrs: TransactionAttrs): string[] {
  return attrs.tag_ids ?? attrs.tagIds ?? [];
}

export class TransactionsApi {
  transactions: TransactionRecord[];
  settledTransactions: SettledTransactionRecord[];
  defaultPerPage: number;
  nextId: number;
  nextRecurrenceId: number;

  constructor(transactions: TransactionRecord[] = defaultTransactions, defaultPerPage = 25) {
    this.transactions = transactions.map((transaction) => ({
      ...transaction,
      tagIds: [...transaction.tagIds],
      recurrences: transaction.recurrences.map((recurrence) => ({ ...recurrence })),
    }));
    this.settledTransactions = [];
    this.defaultPerPage = defaultPerPage;
    this.nextId = transactions.reduce((max, transaction) => Math.max(max, Number(transaction.id) || 0), 0) + 1;
    this.nextRecurrenceId =
      transactions.reduce((max, transaction) => {
        const recurrenceMax = transaction.recurrences.reduce((inner, recurrence) => {
          const numeric = Number(String(recurrence.id).replace(/\D/g, '')) || 0;

          return Math.max(inner, numeric);
        }, 0);

        return Math.max(max, recurrenceMax);
      }, 0) + 1;
  }

  find(id: string) {
    return this.transactions.find((transaction) => transaction.id === id);
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);
    const recurrenceMatch = path.match(/\/api\/v1\/transactions\/([^/]+)\/recurrences$/);
    const cancelMatch = path.match(/\/api\/v1\/transactions\/([^/]+)\/cancel$/);

    if (recurrenceMatch && method === 'POST') {
      return this.createRecurrence(route, recurrenceMatch[1]);
    }

    if (cancelMatch && method === 'POST') {
      return this.cancel(route, cancelMatch[1]);
    }

    if (path === '/api/v1/transactions/settled' && method === 'GET') {
      return this.listSettled(route, apiSearch(url));
    }

    const id = path.match(/\/api\/v1\/transactions\/([^/]+)$/)?.[1];

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

  private listSettled(route: Route, search: URLSearchParams) {
    const month = Number(search.get('month'));
    const year = Number(search.get('year'));
    const type = search.get('type');
    let items = [...this.settledTransactions];

    if (Number.isInteger(month) && Number.isInteger(year)) {
      items = items.filter((settled) => {
        const occurred = yearMonthFromIso(settled.occurredOn);

        return occurred?.month === month && occurred.year === year;
      });
    }

    if (type === 'credit_card') {
      items = items.filter((settled) => Boolean(settled.creditCardId));
    } else if (type === 'account') {
      items = items.filter((settled) => Boolean(settled.accountId) && settled.kind !== 'transfer_between_accounts');
    } else if (type === 'transfer_between_accounts') {
      items = items.filter((settled) => settled.kind === 'transfer_between_accounts');
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: items.map(settledResource),
    });
  }

  private list(route: Route, search: URLSearchParams) {
    const descriptionCont = search.get('q[description_cont]')?.trim().toLowerCase();
    const kindEq = search.get('q[kind_eq]');
    const statusEq = search.get('q[status_eq]');
    const paymentMethodEq = search.get('q[payment_method_eq]');
    const recurrenceTypeEq = search.get('q[recurrence_type_eq]');
    const categoryIdEq = search.get('q[category_id_eq]');
    const page = Number(search.get('page') ?? 1);
    const perPage = Number(search.get('per_page') ?? this.defaultPerPage);
    const sorts = parseSort(search.get('sort'));

    let items = [...this.transactions];

    if (descriptionCont) {
      items = items.filter((transaction) => transaction.description.toLowerCase().includes(descriptionCont));
    }

    if (kindEq && isKind(kindEq)) {
      items = items.filter((transaction) => transaction.kind === kindEq);
    }

    if (statusEq && isStatus(statusEq)) {
      items = items.filter((transaction) => transaction.status === statusEq);
    }

    if (paymentMethodEq && isPaymentMethod(paymentMethodEq)) {
      items = items.filter((transaction) => transaction.paymentMethod === paymentMethodEq);
    }

    if (recurrenceTypeEq && isRecurrenceType(recurrenceTypeEq)) {
      items = items.filter((transaction) => transaction.recurrenceType === recurrenceTypeEq);
    }

    if (categoryIdEq) {
      items = items.filter((transaction) => transaction.categoryId === categoryIdEq);
    }

    if (sorts.length) {
      items.sort((left, right) => compareTransactions(left, right, sorts));
    }

    const pages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
    const offset = (currentPage - 1) * perPage;
    const pageItems = items.slice(offset, offset + perPage);

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: pageItems.map(transactionResource),
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
    const attrs = payloadTransaction((await route.request().postDataJSON()) as { transaction?: TransactionAttrs });
    const description = payloadString(attrs.description);
    const kind = payloadString(attrs.kind);
    const recurrenceType = payloadString(attrs.recurrence_type ?? attrs.recurrenceType);
    const startsOn = payloadString(attrs.starts_on ?? attrs.startsOn);
    const categoryId = payloadString(attrs.category_id ?? attrs.categoryId);
    const value = attrs.value;
    const paymentMethod = payloadString(attrs.payment_method ?? attrs.paymentMethod);
    const accountId = payloadString(attrs.account_id ?? attrs.accountId ?? undefined);
    const creditCardId = payloadString(attrs.credit_card_id ?? attrs.creditCardId ?? undefined);
    const sourceAccountId = payloadString(attrs.source_account_id ?? attrs.sourceAccountId ?? undefined);
    const destinationAccountId = payloadString(attrs.destination_account_id ?? attrs.destinationAccountId ?? undefined);
    const endsOnRaw = attrs.ends_on ?? attrs.endsOn;
    const limitConsumption = payloadString(attrs.limit_consumption_type ?? attrs.limitConsumptionType ?? undefined);

    if (!description) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { description: ["can't be blank"] } }, 422);
    }

    if (!isKind(kind)) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { kind: ["can't be blank"] } }, 422);
    }

    if (!isRecurrenceType(recurrenceType)) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { recurrence_type: ["can't be blank"] } }, 422);
    }

    if (!startsOn) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { starts_on: ["can't be blank"] } }, 422);
    }

    if (value == null || !Number.isFinite(value)) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { value: ["can't be blank"] } }, 422);
    }

    if (!categoryId) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { category_id: ["can't be blank"] } }, 422);
    }

    if (this.transactions.some((transaction) => transaction.description.toLowerCase() === description.toLowerCase())) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { description: ['has already been taken'] } }, 422);
    }

    if (kind === 'transfer_between_accounts') {
      if (!sourceAccountId) {
        return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { source_account_id: ["can't be blank"] } }, 422);
      }

      if (!destinationAccountId) {
        return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { destination_account_id: ["can't be blank"] } }, 422);
      }
    } else if (paymentMethod === 'credit_card') {
      if (!creditCardId) {
        return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { credit_card_id: ["can't be blank"] } }, 422);
      }
    } else if (!accountId) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { account_id: ["can't be blank"] } }, 422);
    }

    const id = String(this.nextId++);
    const transaction: TransactionRecord = {
      id,
      categoryId,
      description,
      kind,
      status: 'pending',
      paymentMethod: kind === 'transfer_between_accounts' ? null : isPaymentMethod(paymentMethod) ? paymentMethod : null,
      recurrenceType,
      installmentsCount: recurrenceType === 'installment' ? 2 : null,
      endsOn: recurrenceType === 'one_time' ? null : payloadString(endsOnRaw ?? undefined) || null,
      accountId: kind === 'transfer_between_accounts' || paymentMethod === 'credit_card' ? null : accountId || null,
      creditCardId: paymentMethod === 'credit_card' ? creditCardId || null : null,
      limitConsumptionType: isLimitConsumptionType(limitConsumption) ? limitConsumption : null,
      sourceAccountId: kind === 'transfer_between_accounts' ? sourceAccountId || null : null,
      destinationAccountId: kind === 'transfer_between_accounts' ? destinationAccountId || null : null,
      tagIds: payloadTags(attrs),
      recurrences: [{ id: `${id}-r${this.nextRecurrenceId++}`, startsOn, value }],
      currentValue: value,
      createdAt: new Date().toISOString(),
    };

    this.transactions.push(transaction);

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Transaction was successfully created.',
      data: transactionResource(transaction),
    });
  }

  private show(route: Route, id: string) {
    const transaction = this.find(id);

    if (!transaction) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      data: transactionResource(transaction),
    });
  }

  private async update(route: Route, id: string) {
    const transaction = this.find(id);

    if (!transaction) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    const attrs = payloadTransaction((await route.request().postDataJSON()) as { transaction?: TransactionAttrs });
    const kind = payloadString(attrs.kind);
    const recurrenceType = payloadString(attrs.recurrence_type ?? attrs.recurrenceType);
    const paymentMethod = payloadString(attrs.payment_method ?? attrs.paymentMethod);
    const startsOn = payloadString(attrs.starts_on ?? attrs.startsOn);
    const categoryId = payloadString(attrs.category_id ?? attrs.categoryId);

    transaction.description = payloadString(attrs.description) || transaction.description;
    transaction.categoryId = categoryId || transaction.categoryId;
    transaction.tagIds = attrs.tag_ids ?? attrs.tagIds ?? transaction.tagIds;

    if (isKind(kind)) {
      transaction.kind = kind;
    }

    if (isRecurrenceType(recurrenceType)) {
      transaction.recurrenceType = recurrenceType;
    }

    if (attrs.payment_method !== undefined || attrs.paymentMethod !== undefined) {
      transaction.paymentMethod = isPaymentMethod(paymentMethod) ? paymentMethod : null;
    }

    if (startsOn) {
      const firstRecurrence = transaction.recurrences[0];

      if (firstRecurrence) {
        firstRecurrence.startsOn = startsOn;
      }
    }

    if (attrs.value != null && Number.isFinite(attrs.value)) {
      transaction.currentValue = attrs.value;
      const firstRecurrence = transaction.recurrences[0];

      if (firstRecurrence) {
        firstRecurrence.value = attrs.value;
      }
    }

    if (attrs.ends_on !== undefined || attrs.endsOn !== undefined) {
      transaction.endsOn = payloadString(attrs.ends_on ?? attrs.endsOn ?? undefined) || null;
    }

    if (attrs.account_id !== undefined || attrs.accountId !== undefined) {
      transaction.accountId = payloadString(attrs.account_id ?? attrs.accountId ?? undefined) || null;
    }

    if (attrs.credit_card_id !== undefined || attrs.creditCardId !== undefined) {
      transaction.creditCardId = payloadString(attrs.credit_card_id ?? attrs.creditCardId ?? undefined) || null;
    }

    if (attrs.limit_consumption_type !== undefined || attrs.limitConsumptionType !== undefined) {
      const limitConsumption = payloadString(attrs.limit_consumption_type ?? attrs.limitConsumptionType ?? undefined);
      transaction.limitConsumptionType = isLimitConsumptionType(limitConsumption) ? limitConsumption : null;
    }

    if (attrs.source_account_id !== undefined || attrs.sourceAccountId !== undefined) {
      transaction.sourceAccountId = payloadString(attrs.source_account_id ?? attrs.sourceAccountId ?? undefined) || null;
    }

    if (attrs.destination_account_id !== undefined || attrs.destinationAccountId !== undefined) {
      transaction.destinationAccountId = payloadString(attrs.destination_account_id ?? attrs.destinationAccountId ?? undefined) || null;
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Transaction was successfully updated.',
      data: transactionResource(transaction),
    });
  }

  private destroy(route: Route, id: string) {
    const transaction = this.find(id);

    if (!transaction) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    this.transactions = this.transactions.filter((item) => transaction.id !== item.id);

    return fulfillJson(route, {
      status: 'success',
      message: 'Transaction was successfully deleted.',
    });
  }

  private cancel(route: Route, id: string) {
    const transaction = this.find(id);

    if (!transaction) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    transaction.status = 'canceled';

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Transaction was successfully canceled.',
      data: transactionResource(transaction),
    });
  }

  private async createRecurrence(route: Route, id: string) {
    const transaction = this.find(id);

    if (!transaction) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    const payload = (await route.request().postDataJSON()) as { transaction_recurrence?: RecurrenceAttrs; transactionRecurrence?: RecurrenceAttrs };
    const attrs = payload.transaction_recurrence ?? payload.transactionRecurrence ?? {};
    const startsOn = payloadString(attrs.starts_on ?? attrs.startsOn);
    const value = attrs.value;

    if (!startsOn) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { starts_on: ["can't be blank"] } }, 422);
    }

    if (value == null || !Number.isFinite(value)) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { value: ["can't be blank"] } }, 422);
    }

    transaction.recurrences.push({
      id: `${transaction.id}-r${this.nextRecurrenceId++}`,
      startsOn,
      value,
      changeForNextMonths: Boolean(attrs.change_for_next_months ?? attrs.changeForNextMonths),
    });
    transaction.currentValue = value;

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Transaction was successfully updated.',
      data: transactionResource(transaction),
    });
  }
}

export async function mockTransactionsApi(page: Page, transactions = new TransactionsApi()) {
  await page.route(/\/api\/v1\/transactions(\/|\?|$)/, (route) => transactions.handle(route));

  return transactions;
}
