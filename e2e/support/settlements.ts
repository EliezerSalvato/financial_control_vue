import type { Page, Route } from '@playwright/test';
import { apiPath, fulfillJson } from './http';

export const PROCESS_MONTH_MESSAGE = 'The month is being processed.';
export const LAST_PROCESSED_AT = '2026-09-08T15:00:00.000Z';

export class SettlementsApi {
  async handle(route: Route) {
    const method = route.request().method();
    const path = apiPath(route.request().url());

    if (path === '/api/v1/settlements/processing' && method === 'POST') {
      return fulfillJson(route, {
        status: 'success',
        message: PROCESS_MONTH_MESSAGE,
      });
    }

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }
}

export async function mockSettlementsApi(page: Page, settlements = new SettlementsApi()) {
  await page.route(/\/api\/v1\/settlements(\/|\?|$)/, (route) => settlements.handle(route));

  return settlements;
}
