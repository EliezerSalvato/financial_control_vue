import type { Route } from '@playwright/test';

export function fulfillJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export function apiPath(url: string): string {
  return new URL(url).pathname;
}

export function apiSearch(url: string): URLSearchParams {
  return new URL(url).searchParams;
}
