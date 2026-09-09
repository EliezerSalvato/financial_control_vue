import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type CreditCardRecord = {
  id: string;
  institutionId: string;
  defaultPaymentAccountId: string;
  name: string;
  totalLimit: number;
  availableLimit: number;
  allowNegativeAvailableLimit: boolean;
  closingDay: number;
  dueDay: number;
  network: string;
  active: boolean;
};

export const defaultCreditCards: CreditCardRecord[] = [
  {
    id: '1',
    institutionId: '1',
    defaultPaymentAccountId: '1',
    name: 'Platinum',
    totalLimit: 10000,
    availableLimit: 7500,
    allowNegativeAvailableLimit: false,
    closingDay: 10,
    dueDay: 17,
    network: 'visa',
    active: true,
  },
  {
    id: '2',
    institutionId: '2',
    defaultPaymentAccountId: '2',
    name: 'Gold',
    totalLimit: 5000,
    availableLimit: 1200,
    allowNegativeAvailableLimit: false,
    closingDay: 5,
    dueDay: 12,
    network: 'mastercard',
    active: true,
  },
  {
    id: '3',
    institutionId: '1',
    defaultPaymentAccountId: '1',
    name: 'Archive',
    totalLimit: 2000,
    availableLimit: 0,
    allowNegativeAvailableLimit: true,
    closingDay: 1,
    dueDay: 8,
    network: 'elo',
    active: false,
  },
];

type SortField = 'name' | 'network' | 'total_limit' | 'available_limit' | 'active';
type SortEntry = { field: SortField; direction: 'asc' | 'desc' };

type CreditCardAttrs = {
  name?: string;
  institution_id?: string;
  institutionId?: string;
  default_payment_account_id?: string;
  defaultPaymentAccountId?: string;
  total_limit?: number;
  totalLimit?: number;
  allow_negative_available_limit?: boolean;
  allowNegativeAvailableLimit?: boolean;
  closing_day?: number;
  closingDay?: number;
  due_day?: number;
  dueDay?: number;
  network?: string;
  active?: boolean;
};

type CreditCardPayload = {
  credit_card?: CreditCardAttrs;
  creditCard?: CreditCardAttrs;
};

export type InvoiceSettlementRecord = {
  id: string;
  creditCardId: string;
  paymentAccountId: string;
  openingDate: string;
  closingDate: string;
  dueDate: string;
  totalValue: number;
  releasedLimit: number;
  settledOn: string;
};

function creditCardResource(creditCard: CreditCardRecord) {
  return {
    id: creditCard.id,
    type: 'credit_card' as const,
    attributes: {
      id: creditCard.id,
      institutionId: creditCard.institutionId,
      defaultPaymentAccountId: creditCard.defaultPaymentAccountId,
      name: creditCard.name,
      totalLimit: creditCard.totalLimit,
      availableLimit: creditCard.availableLimit,
      allowNegativeAvailableLimit: creditCard.allowNegativeAvailableLimit,
      closingDay: creditCard.closingDay,
      dueDay: creditCard.dueDay,
      network: creditCard.network,
      active: creditCard.active,
    },
  };
}

function invoiceSettlementResource(invoice: InvoiceSettlementRecord) {
  return {
    id: invoice.id,
    type: 'credit_card_invoice_settlement' as const,
    attributes: {
      id: invoice.id,
      creditCardId: invoice.creditCardId,
      paymentAccountId: invoice.paymentAccountId,
      openingDate: invoice.openingDate,
      closingDate: invoice.closingDate,
      dueDate: invoice.dueDate,
      totalValue: invoice.totalValue,
      releasedLimit: invoice.releasedLimit,
      settledOn: invoice.settledOn,
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
      (field === 'name' || field === 'network' || field === 'total_limit' || field === 'available_limit' || field === 'active') &&
      (direction === 'asc' || direction === 'desc')
    ) {
      entries.push({ field, direction });
    }
  }

  return entries;
}

function sortValue(creditCard: CreditCardRecord, field: SortField): string | number | boolean {
  if (field === 'total_limit') {
    return creditCard.totalLimit;
  }

  if (field === 'available_limit') {
    return creditCard.availableLimit;
  }

  return creditCard[field];
}

function compareCreditCards(left: CreditCardRecord, right: CreditCardRecord, sorts: SortEntry[]): number {
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

function payloadAttrs(payload: CreditCardPayload): CreditCardAttrs {
  return payload.credit_card ?? payload.creditCard ?? {};
}

function payloadInstitutionId(attrs: CreditCardAttrs): string {
  return (attrs.institution_id ?? attrs.institutionId)?.trim() ?? '';
}

function payloadAccountId(attrs: CreditCardAttrs): string {
  return (attrs.default_payment_account_id ?? attrs.defaultPaymentAccountId)?.trim() ?? '';
}

function payloadTotalLimit(attrs: CreditCardAttrs): number {
  const value = attrs.total_limit ?? attrs.totalLimit ?? 0;

  return Number.isFinite(value) ? value : 0;
}

function payloadAllowNegative(attrs: CreditCardAttrs): boolean {
  return attrs.allow_negative_available_limit ?? attrs.allowNegativeAvailableLimit ?? false;
}

function payloadDay(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

export class CreditCardsApi {
  creditCards: CreditCardRecord[];
  invoiceSettlements: InvoiceSettlementRecord[];
  defaultPerPage: number;
  nextId: number;

  constructor(creditCards: CreditCardRecord[] = defaultCreditCards, defaultPerPage = 25) {
    this.creditCards = creditCards.map((creditCard) => ({ ...creditCard }));
    this.invoiceSettlements = [];
    this.defaultPerPage = defaultPerPage;
    this.nextId = creditCards.reduce((max, creditCard) => Math.max(max, Number(creditCard.id) || 0), 0) + 1;
  }

  find(id: string) {
    return this.creditCards.find((creditCard) => creditCard.id === id);
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);

    if (path === '/api/v1/credit_cards/invoice_settlements' && method === 'GET') {
      return this.listInvoiceSettlements(route, apiSearch(url));
    }

    const id = path.match(/\/api\/v1\/credit_cards\/([^/]+)$/)?.[1];

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

  private listInvoiceSettlements(route: Route, search: URLSearchParams) {
    const month = Number(search.get('month'));
    const year = Number(search.get('year'));
    const prefix = Number.isInteger(month) && Number.isInteger(year) ? `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}` : null;
    const items = prefix ? this.invoiceSettlements.filter((invoice) => invoice.dueDate.startsWith(prefix)) : [];

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: items.map(invoiceSettlementResource),
    });
  }

  private list(route: Route, search: URLSearchParams) {
    const nameCont = search.get('q[name_cont]')?.trim().toLowerCase();
    const networkCont = search.get('q[network_cont]')?.trim().toLowerCase();
    const institutionIdEq = search.get('q[institution_id_eq]');
    const accountIdEq = search.get('q[default_payment_account_id_eq]');
    const activeEq = search.get('q[active_eq]');
    const page = Number(search.get('page') ?? 1);
    const perPage = Number(search.get('per_page') ?? this.defaultPerPage);
    const sorts = parseSort(search.get('sort'));

    let items = [...this.creditCards];

    if (nameCont) {
      items = items.filter((creditCard) => creditCard.name.toLowerCase().includes(nameCont));
    }

    if (networkCont) {
      items = items.filter((creditCard) => creditCard.network.toLowerCase().includes(networkCont));
    }

    if (institutionIdEq) {
      items = items.filter((creditCard) => creditCard.institutionId === institutionIdEq);
    }

    if (accountIdEq) {
      items = items.filter((creditCard) => creditCard.defaultPaymentAccountId === accountIdEq);
    }

    if (activeEq === 'true' || activeEq === 'false') {
      const active = activeEq === 'true';
      items = items.filter((creditCard) => creditCard.active === active);
    }

    if (sorts.length) {
      items.sort((left, right) => compareCreditCards(left, right, sorts));
    }

    const pages = Math.max(1, Math.ceil(items.length / perPage));
    const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
    const offset = (currentPage - 1) * perPage;
    const pageItems = items.slice(offset, offset + perPage);

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: pageItems.map(creditCardResource),
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
    const attrs = payloadAttrs((await route.request().postDataJSON()) as CreditCardPayload);
    const name = attrs.name?.trim() ?? '';
    const institutionId = payloadInstitutionId(attrs);
    const defaultPaymentAccountId = payloadAccountId(attrs);
    const network = attrs.network?.trim() ?? '';
    const closingDay = payloadDay(attrs.closing_day ?? attrs.closingDay);
    const dueDay = payloadDay(attrs.due_day ?? attrs.dueDay);
    const totalLimit = payloadTotalLimit(attrs);

    if (!name) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ["can't be blank"] } }, 422);
    }

    if (!institutionId) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { institution_id: ["can't be blank"] } }, 422);
    }

    if (!defaultPaymentAccountId) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { default_payment_account_id: ["can't be blank"] } }, 422);
    }

    if (!network) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { network: ["can't be blank"] } }, 422);
    }

    if (closingDay == null) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { closing_day: ["can't be blank"] } }, 422);
    }

    if (dueDay == null) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { due_day: ["can't be blank"] } }, 422);
    }

    if (this.creditCards.some((creditCard) => creditCard.name.toLowerCase() === name.toLowerCase())) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { name: ['has already been taken'] } }, 422);
    }

    const creditCard: CreditCardRecord = {
      id: String(this.nextId++),
      institutionId,
      defaultPaymentAccountId,
      name,
      totalLimit,
      availableLimit: totalLimit,
      allowNegativeAvailableLimit: payloadAllowNegative(attrs),
      closingDay,
      dueDay,
      network,
      active: true,
    };

    this.creditCards.push(creditCard);

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Credit card was successfully created.',
      data: creditCardResource(creditCard),
    });
  }

  private show(route: Route, id: string) {
    const creditCard = this.find(id);

    if (!creditCard) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      data: creditCardResource(creditCard),
    });
  }

  private async update(route: Route, id: string) {
    const creditCard = this.find(id);

    if (!creditCard) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    const attrs = payloadAttrs((await route.request().postDataJSON()) as CreditCardPayload);
    const nextTotalLimit = attrs.total_limit ?? attrs.totalLimit;
    const previousTotalLimit = creditCard.totalLimit;

    creditCard.name = attrs.name?.trim() ?? creditCard.name;
    creditCard.institutionId = payloadInstitutionId(attrs) || creditCard.institutionId;
    creditCard.defaultPaymentAccountId = payloadAccountId(attrs) || creditCard.defaultPaymentAccountId;
    creditCard.network = attrs.network?.trim() ?? creditCard.network;
    creditCard.allowNegativeAvailableLimit =
      attrs.allow_negative_available_limit ?? attrs.allowNegativeAvailableLimit ?? creditCard.allowNegativeAvailableLimit;
    creditCard.active = attrs.active ?? creditCard.active;

    if (typeof nextTotalLimit === 'number' && Number.isFinite(nextTotalLimit)) {
      creditCard.availableLimit += nextTotalLimit - previousTotalLimit;
      creditCard.totalLimit = nextTotalLimit;
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Credit card was successfully updated.',
      data: creditCardResource(creditCard),
    });
  }

  private destroy(route: Route, id: string) {
    const creditCard = this.find(id);

    if (!creditCard) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    this.creditCards = this.creditCards.filter((item) => creditCard.id !== item.id);

    return fulfillJson(route, {
      status: 'success',
      message: 'Credit card was successfully deleted.',
    });
  }
}

export async function mockCreditCardsApi(page: Page, creditCards = new CreditCardsApi()) {
  await page.route(/\/api\/v1\/credit_cards(\/|\?|$)/, (route) => creditCards.handle(route));

  return creditCards;
}
