import type { Page, Route } from '@playwright/test';
import { currentAppPeriod, isoDate } from './monthly_statements';
import { apiPath, apiSearch, fulfillJson } from './http';

export type GoalTransactionKind = 'income' | 'expense' | 'transfer_between_accounts';
export type GoalTransactionRecurrenceType = 'one_time' | 'installment' | 'recurring';
export type GoalTargetKind = 'category' | 'tag';

export type GoalTransactionRecord = {
  id: string;
  month: number;
  year: number;
  kind: GoalTransactionKind;
  description: string;
  recurrenceType: GoalTransactionRecurrenceType;
  value: number;
  firstRecurrenceOn: string;
  currentRecurrenceOn: string;
  endsOn: string | null;
  categoryId: string | null;
  tagIds: string[];
};

export type GoalTargetRecord = {
  id: string;
  month: number;
  year: number;
  kind: GoalTargetKind;
  name: string;
  color: string;
  value: number;
};

export function defaultGoalTransactions(period = currentAppPeriod()): GoalTransactionRecord[] {
  const groceriesDate = isoDate(period, 5);
  const netflixDate = isoDate(period, 8);

  return [
    {
      id: '2',
      month: period.month,
      year: period.year,
      kind: 'expense',
      description: 'Groceries',
      recurrenceType: 'one_time',
      value: 450,
      firstRecurrenceOn: groceriesDate,
      currentRecurrenceOn: groceriesDate,
      endsOn: null,
      categoryId: '1',
      tagIds: ['2'],
    },
    {
      id: '4',
      month: period.month,
      year: period.year,
      kind: 'expense',
      description: 'Netflix',
      recurrenceType: 'one_time',
      value: 45.9,
      firstRecurrenceOn: netflixDate,
      currentRecurrenceOn: netflixDate,
      endsOn: null,
      categoryId: '1',
      tagIds: [],
    },
  ];
}

export function defaultGoalTargets(period = currentAppPeriod()): GoalTargetRecord[] {
  return [
    { id: '1', month: period.month, year: period.year, kind: 'category', name: 'Food', color: '#ff0000', value: 500 },
    { id: '2', month: period.month, year: period.year, kind: 'category', name: 'Transport', color: '#00ff00', value: 400 },
    { id: '2', month: period.month, year: period.year, kind: 'tag', name: 'Home', color: '#0000ff', value: 200 },
  ];
}

function transactionResource(transaction: GoalTransactionRecord) {
  return {
    id: transaction.id,
    type: 'goal_transaction' as const,
    attributes: {
      id: transaction.id,
      kind: transaction.kind,
      description: transaction.description,
      recurrenceType: transaction.recurrenceType,
      value: transaction.value,
      firstRecurrenceOn: transaction.firstRecurrenceOn,
      currentRecurrenceOn: transaction.currentRecurrenceOn,
      endsOn: transaction.endsOn,
      categoryId: transaction.categoryId,
      tagIds: transaction.tagIds,
    },
  };
}

function targetResource(target: GoalTargetRecord) {
  return {
    id: target.id,
    type: 'goal_target' as const,
    attributes: {
      id: target.id,
      kind: target.kind,
      name: target.name,
      color: target.color,
      value: target.value,
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

function matchesPeriod(item: { month: number; year: number }, period: { month: number; year: number } | null) {
  return period != null && item.month === period.month && item.year === period.year;
}

export class GoalsApi {
  transactions: GoalTransactionRecord[];
  targets: GoalTargetRecord[];

  constructor(transactions: GoalTransactionRecord[] = defaultGoalTransactions(), targets: GoalTargetRecord[] = defaultGoalTargets()) {
    this.transactions = transactions.map((transaction) => ({ ...transaction, tagIds: [...transaction.tagIds] }));
    this.targets = targets.map((target) => ({ ...target }));
  }

  async handle(route: Route) {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const path = apiPath(url);
    const search = apiSearch(url);

    if (path === '/api/v1/goals/targets' && method === 'GET') {
      return this.listTargets(route, search);
    }

    if (path === '/api/v1/goals' && method === 'GET') {
      return this.list(route, search);
    }

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }

  private list(route: Route, search: URLSearchParams) {
    const period = periodFromSearch(search);
    const items = this.transactions.filter((transaction) => matchesPeriod(transaction, period));

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: items.map(transactionResource),
    });
  }

  private listTargets(route: Route, search: URLSearchParams) {
    const period = periodFromSearch(search);
    const items = this.targets.filter((target) => matchesPeriod(target, period));

    return fulfillJson(route, {
      status: 'success',
      type: 'collection',
      data: items.map(targetResource),
    });
  }
}

export async function mockGoalsApi(page: Page, goals = new GoalsApi()) {
  await page.route(/\/api\/v1\/goals(\/|\?|$)/, (route) => goals.handle(route));

  return goals;
}
