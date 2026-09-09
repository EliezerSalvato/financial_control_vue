import type { Page, Route } from '@playwright/test';
import { currentAppPeriod } from './monthly_statements';
import { apiPath, apiSearch, fulfillJson } from './http';

export type MonthlyStatusKind = 'open' | 'closed';

export type MonthlyStatusRecord = {
  id: string;
  month: number;
  year: number;
  status: MonthlyStatusKind;
  processing: boolean;
  lastProcessedAt: string | null;
};

export function defaultMonthlyStatuses(period = currentAppPeriod()): MonthlyStatusRecord[] {
  return [
    {
      id: '1',
      month: period.month,
      year: period.year,
      status: 'open',
      processing: false,
      lastProcessedAt: null,
    },
  ];
}

function statusResource(status: MonthlyStatusRecord) {
  return {
    id: status.id,
    type: 'monthly_status' as const,
    attributes: {
      id: status.id,
      month: status.month,
      year: status.year,
      status: status.status,
      processing: status.processing,
      lastProcessedAt: status.lastProcessedAt,
    },
  };
}

type StatusAttrs = {
  month?: number;
  year?: number;
  status?: string;
};

export class MonthlyStatusesApi {
  statuses: MonthlyStatusRecord[];
  nextId: number;

  constructor(statuses: MonthlyStatusRecord[] = defaultMonthlyStatuses()) {
    this.statuses = statuses.map((status) => ({ ...status }));
    this.nextId = statuses.reduce((max, status) => Math.max(max, Number(status.id) || 0), 0) + 1;
  }

  find(month: number, year: number) {
    return this.statuses.find((status) => status.month === month && status.year === year);
  }

  async handle(route: Route) {
    const request = route.request();
    const method = request.method();
    const path = apiPath(request.url());

    if (path !== '/api/v1/monthly_statuses') {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    if (method === 'GET') {
      return this.show(route, apiSearch(request.url()));
    }

    if (method === 'PATCH') {
      return this.update(route);
    }

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }

  private show(route: Route, search: URLSearchParams) {
    const month = Number(search.get('month'));
    const year = Number(search.get('year'));
    const status = Number.isInteger(month) && Number.isInteger(year) ? this.find(month, year) : undefined;

    if (!status) {
      return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      data: statusResource(status),
    });
  }

  private async update(route: Route) {
    const payload = (await route.request().postDataJSON()) as { monthly_status?: StatusAttrs; monthlyStatus?: StatusAttrs };
    const attrs = payload.monthly_status ?? payload.monthlyStatus ?? {};
    const month = attrs.month;
    const year = attrs.year;
    const nextStatus = attrs.status;

    if (month == null || year == null || (nextStatus !== 'open' && nextStatus !== 'closed')) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { status: ["can't be blank"] } }, 422);
    }

    let status = this.find(month, year);

    if (!status) {
      status = {
        id: String(this.nextId++),
        month,
        year,
        status: nextStatus,
        processing: false,
        lastProcessedAt: null,
      };
      this.statuses.push(status);
    } else {
      status.status = nextStatus;
    }

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      message: 'Month was successfully closed.',
      data: statusResource(status),
    });
  }
}

export async function mockMonthlyStatusesApi(page: Page, monthlyStatuses = new MonthlyStatusesApi()) {
  await page.route(/\/api\/v1\/monthly_statuses(\?|$)/, (route) => monthlyStatuses.handle(route));

  return monthlyStatuses;
}
