import type { Page } from '@playwright/test';
import { currentAppPeriod, periodLabel, shiftPeriod } from './support/monthly_statements';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelTitle(page: Page) {
  return page.locator('nav.panel .panel-heading p');
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(value);
}

test.describe('goals', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/goals');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('opens from the menu and groups targets with transactions', async ({ page, baseURL }) => {
      const current = currentAppPeriod();

      await setupApp(page, baseURL);
      await page.goto('/');
      await page.getByRole('link', { name: 'Goals', exact: true }).click();

      await expect(page).toHaveURL(new RegExp(`/goals\\?month=${current.month}&year=${current.year}`));
      await expect(page.getByRole('button', { name: periodLabel(current) })).toBeVisible();
      await expect(page.locator('.month-status')).toContainText('Open');
      await expect(page.getByRole('button', { name: 'Change status to closed' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Process month' })).toHaveCount(0);
      await expect(panelTitle(page)).toHaveText(['By Categories', 'By Tags']);

      const categories = page.locator('nav.panel').filter({ hasText: 'By Categories' });
      const tags = page.locator('nav.panel').filter({ hasText: 'By Tags' });

      await expect(categories.getByRole('cell', { name: 'Food', exact: true })).toBeVisible();
      await expect(categories.getByRole('cell', { name: formatMoney(495.9), exact: true })).toBeVisible();
      await expect(categories.getByRole('cell', { name: formatMoney(500), exact: true })).toBeVisible();
      await expect(categories.getByRole('cell', { name: formatMoney(4.1), exact: true })).toBeVisible();
      await expect(categories.getByRole('cell', { name: '99.18%', exact: true })).toBeVisible();
      await expect(categories.getByRole('cell', { name: 'Transport', exact: true })).toBeVisible();
      await expect(categories.getByRole('cell', { name: formatMoney(0), exact: true }).first()).toBeVisible();
      await expect(categories.locator('tr', { hasText: 'Transport' }).first()).not.toHaveClass(/goal-color/);

      await expect(tags.getByRole('cell', { name: 'Home', exact: true })).toBeVisible();
      await expect(tags.getByRole('cell', { name: formatMoney(450), exact: true })).toBeVisible();
      await expect(tags.getByRole('cell', { name: formatMoney(200), exact: true })).toBeVisible();
      await expect(tags.getByRole('cell', { name: formatMoney(-250), exact: true })).toBeVisible();
      await expect(tags.locator('.goal-diff-negative')).toHaveText(formatMoney(-250));
      await expect(tags.getByRole('cell', { name: '225%', exact: true })).toBeVisible();
      await expect(categories.locator('.target-color').first()).toHaveCSS('background-color', 'rgb(255, 0, 0)');
      await expect(tags.locator('.target-color')).toHaveCSS('background-color', 'rgb(0, 0, 255)');

      await categories.getByRole('button', { name: 'Show transactions' }).first().click();
      await expect(categories.getByRole('link', { name: 'Groceries' })).toBeVisible();
      await expect(categories.getByRole('link', { name: 'Netflix' })).toBeVisible();

      await categories.getByRole('link', { name: 'Groceries' }).click();
      await expect(page).toHaveURL(/\/transactions\/edit\/2/);
    });

    test('changes the period from the picker', async ({ page, baseURL }) => {
      const current = currentAppPeriod();
      const previous = shiftPeriod(current, -1);

      await setupApp(page, baseURL);
      await page.goto('/goals');

      await page.getByRole('button', { name: '‹ Prev' }).click();
      await expect(page).toHaveURL(new RegExp(`/goals\\?month=${previous.month}&year=${previous.year}`));
      await expect(page.getByRole('button', { name: periodLabel(previous) })).toBeVisible();
      await expect(page.locator('.month-status')).toContainText('Open');
      await expect(page.getByText('No categories with goals found.')).toBeVisible();
      await expect(page.getByText('No tags with goals found.')).toBeVisible();
    });
  });
});
