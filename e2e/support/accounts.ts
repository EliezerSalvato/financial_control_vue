import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type AccountKind = 'bank_account' | 'cash';
export type BankAccountType = 'checking' | 'savings' | 'investment' | 'salary';

export type AccountRecord = {
  id: string;
  name: string;
  kind: AccountKind;
  institutionId: string | null;
  bankAccountType: BankAccountType | null;
  currentBalance: number;
  allowNegativeBalance: boolean;
  color: string;
  active: boolean;
};

export const defaultAccounts: AccountRecord[] = [
  {
    id: '1',
    name: 'Checking',
    kind: 'bank_account',
    institutionId: '1',
    bankAccountType: 'checking',
    currentBalance: 1500.5,
    allowNegativeBalance: false,
    color: '#8a05be',
    active: true,
  },
  {
    id: '2',
    name: 'Savings',
    kind: 'bank_account',
    institutionId: '2',
    bankAccountType: 'savings',
    currentBalance: 800,
    allowNegativeBalance: false,
    color: '#ff6200',
    active: true,
  },
  {
    id: '3',
    name: 'Archive',
    kind: 'cash',
    institutionId: null,
    bankAccountType: null,
    currentBalance: 50,
    allowNegativeBalance: true,
    color: '#0000ff',
    active: false,
  },
];

type SortField = 'name' | 'kind' | 'bank_account_type' | 'current_balance' | 'active';
type SortEntry = { field: SortField; direction: 'asc' | 'desc' };

type AccountPayload = {
  account?: {
    name?: string;
    kind?: string;
    color?: string;
    current_balance?: number;
    currentBalance?: number;
    allow_negative_balance?: boolean;
    allowNegativeBalance?: boolean;
    institution_id?: string;
    institutionId?: string;
    bank_account_type?: string;
    bankAccountType?: string;
    active?: boolean;
  };
};

function accountResource(account: AccountRecord) {
  return {
    id: account.id,
    type: 'account' as const,
    attributes: {
      id: account.id,
      name: account.name,
      kind: account.kind,
      institutionId: account.institutionId,
      bankAccountType: account.bankAccountType,
      currentBalance: account.currentBalance,
      allowNegativeBalance: account.allowNegativeBalance,
      color: account.color,
      active: account.active,
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
      (field === 'name' || field === 'kind' || field === 'bank_account_type' || field === 'current_balance' || field === 'active') &&
      (direction === 'asc' || direction === 'desc')
    ) {
      entries.push({ field, direction });
    }
  }

  return entries;
}

function sortValue(account: AccountRecord, field: SortField): string | number | boolean {
  if (field === 'bank_account_type') {
    return account.bankAccountType ?? '';
  }

  if (field === 'current_balance') {
    return account.currentBalance;
  }

  return account[field];
}

function compareAccounts(left: AccountRecord, right: AccountRecord, sorts: SortEntry[]): number {
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

function payloadInstitutionId(payload: AccountPayload): string {
  return (payload.account?.institution_id ?? payload.account?.institutionId)?.trim() ?? '';
}

function payloadBankAccountType(payload: AccountPayload): string {
  return (payload.account?.bank_account_type ?? payload.account?.bankAccountType)?.trim() ?? '';
}

function payloadBalance(payload: AccountPayload): number {
  const value = payload.account?.current_balance ?? payload.account?.currentBalance ?? 0;

  return Number.isFinite(value) ? value : 0;
}

function payloadAllowNegative(payload: AccountPayload): boolean {
  return payload.account?.allow_negative_balance ?? payload.account?.allowNegativeBalance ?? false;
}

function isAccountKind(value: string): value is AccountKind {
  return value === 'bank_account' || value === 'cash';
}

function isBankAccountType(value: string): value is BankAccountType {
  return value === 'checking' || value === 'savings' || value === 'investment' || value === 'salary';
}

export class AccountsApi {
  accounts: AccountRecord[];
  defaultPerPage: number;
  nextId: number;

  constructor(accounts: AccountRecord[] = defaultAccounts, defaultPerPage = 25) {
    this.accounts = accounts.map((account) => ({ ...account }));
    this.defaultPerPage = defaultPerPage;
    this.nextId = accounts.reduce((max, account) => Math.max(max, Number(account.id) || 0), 0) + 1;
  }

  find(id: string) {
    return this.accounts.find((account) => account.id === id);
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);
    const id = path.match(/\/api\/v1\/accounts\/([^/]+)$/)?.[1];

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
    const kindEq = search.get('q[kind_eq]');
    const bankAccountTypeEq = search.get('q[bank_account_type_eq]');
    const activeEq = search.get('q[active_eq]');
    const page = Number(search.get('page') ?? 1);
    const perPage = Number(search.get('per_page') ?? this.defaultPerPage);
    const sorts = parseSort(search.get('sort'));

    let items = [...this.accounts];

    if (nameCont) {
      items = items.filter((account) => account.name.toLowerCase().includes(nameCont));
    }

    if (kindEq === 'bank_account' || kindEq === 'cash') {
      items = items.filter((account) => account.kind === kindEq);
    }

    if (bankAccountTypeEq && isBankAccountType(bankAccountTypeEq)) {
      items = items.filter((account) => account.bankAccountType === bankAccountTypeEq);
    }

    if (activeEq === 'true' || activeEq === 'false') {
      const active = activeEq === 'true';
      items = items.filter((account) => account.active === active);
    }

    if (sorts.length) {
      items.sort((left, right) => compareAccounts(left, right, sorts));
    }

    const pages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
    const offset = (currentPage - 1) * perPage;
    const pageItems = items.slice(offset, offset + perPage);

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: pageItems.map(accountResource),
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
    const payload = (await route.request().postDataJSON()) as AccountPayload;
    const name = payload.account?.name?.trim() ?? '';
    const kind = payload.account?.kind?.trim() ?? '';
    const color = payload.account?.color?.trim() ?? '';
    const institutionId = payloadInstitutionId(payload);
    const bankAccountType = payloadBankAccountType(payload);

    if (!name) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ["can't be blank"] } }, 422);
    }

    if (!isAccountKind(kind)) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { kind: ["can't be blank"] } }, 422);
    }

    if (kind === 'bank_account' && !institutionId) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { institution_id: ["can't be blank"] } }, 422);
    }

    if (kind === 'bank_account' && !isBankAccountType(bankAccountType)) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { bank_account_type: ["can't be blank"] } }, 422);
    }

    if (this.accounts.some((account) => account.name.toLowerCase() === name.toLowerCase())) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ['has already been taken'] } }, 422);
    }

    const account: AccountRecord = {
      id: String(this.nextId++),
      name,
      kind,
      institutionId: kind === 'bank_account' ? institutionId : null,
      bankAccountType: kind === 'bank_account' && isBankAccountType(bankAccountType) ? bankAccountType : null,
      currentBalance: payloadBalance(payload),
      allowNegativeBalance: payloadAllowNegative(payload),
      color: color || '#000000',
      active: true,
    };

    this.accounts.push(account);

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Account was successfully created.',
      data: accountResource(account),
    });
  }

  private show(route: Route, id: string) {
    const account = this.find(id);

    if (!account) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      data: accountResource(account),
    });
  }

  private async update(route: Route, id: string) {
    const account = this.find(id);

    if (!account) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    const payload = (await route.request().postDataJSON()) as AccountPayload;
    const kind = payload.account?.kind?.trim();
    const institutionId = payloadInstitutionId(payload);
    const bankAccountType = payloadBankAccountType(payload);

    account.name = payload.account?.name?.trim() ?? account.name;
    account.kind = isAccountKind(kind ?? '') ? kind! : account.kind;
    account.color = payload.account?.color?.trim() ?? account.color;
    account.currentBalance = payload.account?.current_balance ?? payload.account?.currentBalance ?? account.currentBalance;
    account.allowNegativeBalance = payload.account?.allow_negative_balance ?? payload.account?.allowNegativeBalance ?? account.allowNegativeBalance;
    account.active = payload.account?.active ?? account.active;

    if (account.kind === 'bank_account') {
      account.institutionId = institutionId || account.institutionId;
      account.bankAccountType = isBankAccountType(bankAccountType) ? bankAccountType : account.bankAccountType;
    } else {
      account.institutionId = null;
      account.bankAccountType = null;
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Account was successfully updated.',
      data: accountResource(account),
    });
  }

  private destroy(route: Route, id: string) {
    const account = this.find(id);

    if (!account) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    this.accounts = this.accounts.filter((item) => account.id !== item.id);

    return fulfillJson(route, {
      status: 'success',
      message: 'Account was successfully deleted.',
    });
  }
}

export async function mockAccountsApi(page: Page, accounts = new AccountsApi()) {
  await page.route(/\/api\/v1\/accounts(\/|\?|$)/, (route) => accounts.handle(route));

  return accounts;
}
