import type { Page } from '@playwright/test';
import { defaultAccounts } from './support/accounts';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelTitle(page: Page) {
  return page.locator('nav.panel .panel-heading-title');
}

async function chooseOption(page: Page, triggerName: string, option: string) {
  await page.getByRole('button', { name: triggerName }).click();
  await page.getByRole('option', { name: option }).click();
}

test.describe('accounts', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/accounts');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('lists accounts', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');

      await expect(panelTitle(page)).toHaveText(/accounts/i);
      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Savings' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
    });

    test('shows an empty state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { accounts: [] });

      await page.goto('/accounts');

      await expect(page.getByText('No records found.')).toBeVisible();
    });

    test('creates a bank account', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');
      await expect(page.getByRole('link', { name: 'New account' })).toBeVisible();
      await page.getByRole('link', { name: 'New account' }).click();

      await expect(panelTitle(page)).toHaveText(/new account/i);
      await page.locator('form input[name="name"]').fill('Cora');
      await chooseOption(page, 'Institution *', 'Nubank');
      await chooseOption(page, 'Account type *', 'Checking');
      await page.locator('form input[name="color"]').fill('#336699');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/accounts$/);
      await expect(page.getByText('Account was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Cora' })).toBeVisible();
    });

    test('creates a cash account', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts/new');
      await expect(panelTitle(page)).toHaveText(/new account/i);
      await page.locator('form input[name="name"]').fill('Wallet');
      await chooseOption(page, 'Kind *', 'Cash');
      await page.locator('form input[name="color"]').fill('#336699');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/accounts$/);
      await expect(page.getByText('Account was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Wallet' })).toBeVisible();
    });

    test('validates a blank name when creating', async ({ page, baseURL }) => {
      const { accounts } = await setupApp(page, baseURL);
      const initialCount = accounts.accounts.length;

      await page.goto('/accounts/new');
      await chooseOption(page, 'Institution *', 'Nubank');
      await chooseOption(page, 'Account type *', 'Checking');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/accounts\/new$/);
      expect(accounts.accounts).toHaveLength(initialCount);
    });

    test('validates a blank institution when creating', async ({ page, baseURL }) => {
      const { accounts } = await setupApp(page, baseURL);
      const initialCount = accounts.accounts.length;

      await page.goto('/accounts/new');
      await page.locator('form input[name="name"]').fill('Cora');
      await chooseOption(page, 'Account type *', 'Checking');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/accounts\/new$/);
      expect(accounts.accounts).toHaveLength(initialCount);
    });

    test('shows API errors when creating a duplicate account', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts/new');
      await page.locator('form input[name="name"]').fill('Checking');
      await chooseOption(page, 'Institution *', 'Nubank');
      await chooseOption(page, 'Account type *', 'Checking');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('has already been taken')).toBeVisible();
      await expect(page).toHaveURL(/\/accounts\/new$/);
    });

    test('edits an account', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');
      await page.getByRole('link', { name: 'Checking' }).click();

      await expect(panelTitle(page)).toHaveText(/edit account/i);
      await expect(page.locator('form input[name="name"]')).toHaveValue('Checking');
      await expect(page.getByRole('checkbox', { name: 'Active' })).toBeChecked();

      await page.locator('form input[name="name"]').fill('Everyday checking');
      await page.getByRole('checkbox', { name: 'Active' }).uncheck();
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/accounts$/);
      await expect(page.getByText('Account was successfully updated.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Everyday checking' })).toBeVisible();
    });

    test('deletes an account after confirmation', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');
      await expect(page.getByRole('link', { name: 'Savings' })).toBeVisible();
      await page.getByRole('row', { name: 'Savings' }).locator('a.delete').click();

      await expect(page.locator('.modal.is-active')).toBeVisible();
      await expect(page.getByText(/remove the account "Savings"/i)).toBeVisible();
      await page.locator('.modal.is-active').getByRole('button', { name: 'Yes', exact: true }).click();

      await expect(page.getByText('Account was successfully deleted.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Savings' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();
    });

    test('cancels deleting an account', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');
      await expect(page.getByRole('link', { name: 'Savings' })).toBeVisible();
      await page.getByRole('row', { name: 'Savings' }).locator('a.delete').click();
      await page.locator('.modal.is-active').getByRole('button', { name: 'No', exact: true }).click();

      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Savings' })).toBeVisible();
    });

    test('filters accounts by name', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');
      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();

      const filtered = page.waitForRequest((request) => {
        if (request.method() !== 'GET' || !request.url().includes('/api/v1/accounts')) {
          return false;
        }

        return new URL(request.url()).searchParams.get('q[name_cont]') === 'Checking';
      });

      await page.getByPlaceholder('Filter by name').fill('Checking');
      await filtered;

      await expect(page).toHaveURL(/name=Checking/);
      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Savings' })).toHaveCount(0);
    });

    test('filters accounts by kind', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');
      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by kind' }).click();
      await page.getByRole('option', { name: 'Cash' }).click();

      await expect(page).toHaveURL(/kind=cash/);
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Checking' })).toHaveCount(0);
    });

    test('filters accounts by account type', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');
      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by account type' }).click();
      await page.getByRole('option', { name: 'Checking' }).click();

      await expect(page).toHaveURL(/bank_account_type=checking/);
      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Savings' })).toHaveCount(0);
    });

    test('filters accounts by active state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');
      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by active' }).click();
      await page.getByRole('option', { name: 'Inactive' }).click();

      await expect(page).toHaveURL(/active=false/);
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Checking' })).toHaveCount(0);
    });

    test('sorts accounts by name', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts');
      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();
      await page.locator('th.sortable', { hasText: 'Name' }).click();

      await expect(page).toHaveURL(/sort=name(\+| |%20)asc/);
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
    });

    test('paginates accounts', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { accounts: defaultAccounts, perPage: 1 });

      await page.goto('/accounts?per_page=1');

      await expect(page.getByRole('link', { name: 'Checking' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Savings' })).toHaveCount(0);

      await page.locator('.pagination-list').getByText('Next ›').click();

      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByRole('link', { name: 'Savings' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Checking' })).toHaveCount(0);
    });

    test('returns to the list from the new form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/accounts/new');
      await page.getByRole('link', { name: 'Back' }).click();

      await expect(page).toHaveURL(/\/accounts$/);
      await expect(panelTitle(page)).toHaveText(/accounts/i);
    });
  });
});
