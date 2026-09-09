import type { Page, Route } from '@playwright/test';
import { apiPath, apiSearch, fulfillJson } from './http';

export type MonthlyStatementKind = 'income' | 'expense' | 'transfer_between_accounts';
export type MonthlyStatementPaymentMethod = 'credit_card' | 'account';
export type MonthlyStatementRecurrenceType = 'one_time' | 'installment' | 'recurring';

export type MonthlyStatementRecord = {
  id: string;
  month: number;
  year: number;
  kind: MonthlyStatementKind;
  description: string;
  paymentMethod: MonthlyStatementPaymentMethod;
  resourceId: string;
  resourceName: string;
  resourceBrand: string | null;
  openingDate: string;
  closingDate: string;
  dueDate: string | null;
  value: number;
  recurrenceType: MonthlyStatementRecurrenceType;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  startsOn: string;
  endsOn: string | null;
  canceledOn: string | null;
};

export type MonthlyStatementTransferRecord = {
  id: string;
  month: number;
  year: number;
  kind: MonthlyStatementKind;
  description: string;
  recurrenceType: MonthlyStatementRecurrenceType;
  sourceAccountId: string;
  sourceAccountName: string;
  sourceAccountBrand: string | null;
  destinationAccountId: string;
  destinationAccountName: string;
  destinationAccountBrand: string | null;
  openingDate: string;
  closingDate: string;
  value: number;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  startsOn: string;
  endsOn: string | null;
  canceledOn: string | null;
};

export const APP_TIME_ZONE = 'America/New_York';

export function currentAppPeriod(date = new Date()): { month: number; year: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  const valueOf = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);

  return { month: valueOf('month'), year: valueOf('year') };
}

export function shiftPeriod(period: { month: number; year: number }, offset: number): { month: number; year: number } {
  const total = period.year * 12 + (period.month - 1) + offset;

  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function isoDate(period: { month: number; year: number }, day: number): string {
  const lastDay = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  const clamped = Math.min(Math.max(day, 1), lastDay);

  return `${String(period.year).padStart(4, '0')}-${String(period.month).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
}

export function periodUrl(period: { month: number; year: number }): string {
  return `/?month=${period.month}&year=${period.year}`;
}

export function periodLabel(period: { month: number; year: number }): string {
  return `${String(period.month).padStart(2, '0')}/${period.year}`;
}

export function defaultMonthlyStatements(period = currentAppPeriod()): MonthlyStatementRecord[] {
  const previous = shiftPeriod(period, -1);
  const salaryDate = isoDate(period, 1);
  const groceriesDate = isoDate(period, 5);
  const netflixDate = isoDate(period, 8);
  const bonusDate = isoDate(previous, 10);
  const openingDate = isoDate(previous, 11);
  const closingDate = isoDate(period, 10);
  const dueDate = isoDate(period, 17);

  return [
    {
      id: '1',
      month: period.month,
      year: period.year,
      kind: 'income',
      description: 'Salary',
      paymentMethod: 'account',
      resourceId: '1',
      resourceName: 'Checking',
      resourceBrand: '#8a05be',
      openingDate: salaryDate,
      closingDate: salaryDate,
      dueDate: null,
      value: 5000,
      recurrenceType: 'one_time',
      firstRecurrenceOn: salaryDate,
      currentRecurrenceOn: salaryDate,
      startsOn: salaryDate,
      endsOn: null,
      canceledOn: null,
    },
    {
      id: '2',
      month: period.month,
      year: period.year,
      kind: 'expense',
      description: 'Groceries',
      paymentMethod: 'account',
      resourceId: '1',
      resourceName: 'Checking',
      resourceBrand: '#8a05be',
      openingDate: groceriesDate,
      closingDate: groceriesDate,
      dueDate: null,
      value: 85.5,
      recurrenceType: 'one_time',
      firstRecurrenceOn: groceriesDate,
      currentRecurrenceOn: groceriesDate,
      startsOn: groceriesDate,
      endsOn: null,
      canceledOn: null,
    },
    {
      id: '4',
      month: period.month,
      year: period.year,
      kind: 'expense',
      description: 'Netflix',
      paymentMethod: 'credit_card',
      resourceId: '1',
      resourceName: 'Platinum',
      resourceBrand: 'visa',
      openingDate: openingDate,
      closingDate: closingDate,
      dueDate: dueDate,
      value: 45.9,
      recurrenceType: 'one_time',
      firstRecurrenceOn: netflixDate,
      currentRecurrenceOn: netflixDate,
      startsOn: netflixDate,
      endsOn: null,
      canceledOn: null,
    },
    {
      id: '5',
      month: previous.month,
      year: previous.year,
      kind: 'income',
      description: 'Bonus',
      paymentMethod: 'account',
      resourceId: '1',
      resourceName: 'Checking',
      resourceBrand: '#8a05be',
      openingDate: bonusDate,
      closingDate: bonusDate,
      dueDate: null,
      value: 1000,
      recurrenceType: 'one_time',
      firstRecurrenceOn: bonusDate,
      currentRecurrenceOn: bonusDate,
      startsOn: bonusDate,
      endsOn: null,
      canceledOn: null,
    },
  ];
}

export function defaultMonthlyStatementTransfers(period = currentAppPeriod()): MonthlyStatementTransferRecord[] {
  const transferDate = isoDate(period, 3);

  return [
    {
      id: '10',
      month: period.month,
      year: period.year,
      kind: 'transfer_between_accounts',
      description: 'Move to savings',
      recurrenceType: 'one_time',
      sourceAccountId: '1',
      sourceAccountName: 'Checking',
      sourceAccountBrand: '#8a05be',
      destinationAccountId: '2',
      destinationAccountName: 'Savings',
      destinationAccountBrand: '#ff6200',
      openingDate: transferDate,
      closingDate: transferDate,
      value: 200,
      firstRecurrenceOn: transferDate,
      currentRecurrenceOn: transferDate,
      startsOn: transferDate,
      endsOn: null,
      canceledOn: null,
    },
  ];
}

function statementResource(statement: MonthlyStatementRecord) {
  return {
    id: statement.id,
    type: 'monthly_statement' as const,
    attributes: {
      id: statement.id,
      kind: statement.kind,
      description: statement.description,
      paymentMethod: statement.paymentMethod,
      resourceId: statement.resourceId,
      resourceName: statement.resourceName,
      resourceBrand: statement.resourceBrand,
      openingDate: statement.openingDate,
      closingDate: statement.closingDate,
      dueDate: statement.dueDate,
      value: statement.value,
      recurrenceType: statement.recurrenceType,
      firstRecurrenceOn: statement.firstRecurrenceOn,
      currentRecurrenceOn: statement.currentRecurrenceOn,
      startsOn: statement.startsOn,
      endsOn: statement.endsOn,
      canceledOn: statement.canceledOn,
    },
  };
}

function transferResource(transfer: MonthlyStatementTransferRecord) {
  return {
    id: transfer.id,
    type: 'monthly_statement_transfer' as const,
    attributes: {
      id: transfer.id,
      kind: transfer.kind,
      description: transfer.description,
      recurrenceType: transfer.recurrenceType,
      sourceAccountId: transfer.sourceAccountId,
      sourceAccountName: transfer.sourceAccountName,
      sourceAccountBrand: transfer.sourceAccountBrand,
      destinationAccountId: transfer.destinationAccountId,
      destinationAccountName: transfer.destinationAccountName,
      destinationAccountBrand: transfer.destinationAccountBrand,
      openingDate: transfer.openingDate,
      closingDate: transfer.closingDate,
      value: transfer.value,
      firstRecurrenceOn: transfer.firstRecurrenceOn,
      currentRecurrenceOn: transfer.currentRecurrenceOn,
      startsOn: transfer.startsOn,
      endsOn: transfer.endsOn,
      canceledOn: transfer.canceledOn,
    },
  };
}

function periodFromSearch(search: URLSearchParams): { month: number; year: number } | null {
  const month = Number(search.get('month'));
  const year = Number(search.get('year'));

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1) {
    return null;
  }

  return { month, year };
}

export class MonthlyStatementsApi {
  statements: MonthlyStatementRecord[];
  transfers: MonthlyStatementTransferRecord[];

  constructor(
    statements: MonthlyStatementRecord[] = defaultMonthlyStatements(),
    transfers: MonthlyStatementTransferRecord[] = defaultMonthlyStatementTransfers(),
  ) {
    this.statements = statements.map((statement) => ({ ...statement }));
    this.transfers = transfers.map((transfer) => ({ ...transfer }));
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);
    const search = apiSearch(url);

    if (path === '/api/v1/monthly_statements/transfers' && method === 'GET') {
      return this.listTransfers(route, search);
    }

    if (path === '/api/v1/monthly_statements' && method === 'GET') {
      return this.list(route, search);
    }

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }

  private list(route: Route, search: URLSearchParams) {
    const period = periodFromSearch(search);
    const items = period ? this.statements.filter((statement) => statement.month === period.month && statement.year === period.year) : [];

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: items.map(statementResource),
    });
  }

  private listTransfers(route: Route, search: URLSearchParams) {
    const period = periodFromSearch(search);
    const items = period ? this.transfers.filter((transfer) => transfer.month === period.month && transfer.year === period.year) : [];

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: items.map(transferResource),
    });
  }
}

export async function mockMonthlyStatementsApi(page: Page, monthlyStatements = new MonthlyStatementsApi()) {
  await page.route(/\/api\/v1\/monthly_statements(\/|\?|$)/, (route) => monthlyStatements.handle(route));

  return monthlyStatements;
}
