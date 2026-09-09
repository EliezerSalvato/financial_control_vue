import type { Page } from '@playwright/test';
import { defaultInstitutions } from './support/institutions';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelTitle(page: Page) {
  return page.locator('nav.panel .panel-heading-title');
}

async function chooseLogo(page: Page, label: string) {
  await page.getByRole('button', { name: 'Logo *' }).click();
  await page.getByRole('option', { name: label }).click();
}

test.describe('institutions', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/institutions');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('lists institutions', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions');

      await expect(panelTitle(page)).toHaveText(/institutions/i);
      await expect(page.getByRole('link', { name: 'Nubank' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Itau' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
    });

    test('shows an empty state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { institutions: [] });

      await page.goto('/institutions');

      await expect(page.getByText('No records found.')).toBeVisible();
    });

    test('creates an institution', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions');
      await expect(page.getByRole('link', { name: 'New institution' })).toBeVisible();
      await page.getByRole('link', { name: 'New institution' }).click();

      await expect(panelTitle(page)).toHaveText(/new institution/i);
      await page.locator('form input[name="name"]').fill('Cora');
      await chooseLogo(page, 'Generic');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/institutions$/);
      await expect(page.getByText('Institution was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Cora' })).toBeVisible();
    });

    test('validates a blank name when creating', async ({ page, baseURL }) => {
      const { institutions } = await setupApp(page, baseURL);
      const initialCount = institutions.institutions.length;

      await page.goto('/institutions/new');
      await chooseLogo(page, 'Generic');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/institutions\/new$/);
      expect(institutions.institutions).toHaveLength(initialCount);
    });

    test('validates a blank logo when creating', async ({ page, baseURL }) => {
      const { institutions } = await setupApp(page, baseURL);
      const initialCount = institutions.institutions.length;

      await page.goto('/institutions/new');
      await page.locator('form input[name="name"]').fill('Cora');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/institutions\/new$/);
      expect(institutions.institutions).toHaveLength(initialCount);
    });

    test('shows API errors when creating a duplicate institution', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions/new');
      await page.locator('form input[name="name"]').fill('Nubank');
      await chooseLogo(page, 'Generic');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('has already been taken')).toBeVisible();
      await expect(page).toHaveURL(/\/institutions\/new$/);
    });

    test('edits an institution', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions');
      await page.getByRole('link', { name: 'Nubank' }).click();

      await expect(panelTitle(page)).toHaveText(/edit institution/i);
      await expect(page.locator('form input[name="name"]')).toHaveValue('Nubank');
      await expect(page.getByRole('checkbox', { name: 'Active' })).toBeChecked();

      await page.locator('form input[name="name"]').fill('Nu Pagamentos');
      await page.getByRole('checkbox', { name: 'Active' }).uncheck();
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/institutions$/);
      await expect(page.getByText('Institution was successfully updated.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Nu Pagamentos' })).toBeVisible();
    });

    test('deletes an institution after confirmation', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions');
      await expect(page.getByRole('link', { name: 'Itau' })).toBeVisible();
      await page.getByRole('row', { name: 'Itau' }).locator('a.delete').click();

      await expect(page.locator('.modal.is-active')).toBeVisible();
      await expect(page.getByText(/remove the institution "Itau"/i)).toBeVisible();
      await page.locator('.modal.is-active').getByRole('button', { name: 'Yes', exact: true }).click();

      await expect(page.getByText('Institution was successfully deleted.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Itau' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Nubank' })).toBeVisible();
    });

    test('cancels deleting an institution', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions');
      await expect(page.getByRole('link', { name: 'Itau' })).toBeVisible();
      await page.getByRole('row', { name: 'Itau' }).locator('a.delete').click();
      await page.locator('.modal.is-active').getByRole('button', { name: 'No', exact: true }).click();

      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Itau' })).toBeVisible();
    });

    test('filters institutions by name', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions');
      await expect(page.getByRole('link', { name: 'Nubank' })).toBeVisible();

      const filtered = page.waitForRequest((request) => {
        if (request.method() !== 'GET' || !request.url().includes('/api/v1/institutions')) {
          return false;
        }

        return new URL(request.url()).searchParams.get('q[name_cont]') === 'Nubank';
      });

      await page.getByPlaceholder('Filter by name').fill('Nubank');
      await filtered;

      await expect(page).toHaveURL(/name=Nubank/);
      await expect(page.getByRole('link', { name: 'Nubank' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Itau' })).toHaveCount(0);
    });

    test('filters institutions by active state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions');
      await expect(page.getByRole('link', { name: 'Nubank' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by active' }).click();
      await page.getByRole('option', { name: 'Inactive' }).click();

      await expect(page).toHaveURL(/active=false/);
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Nubank' })).toHaveCount(0);
    });

    test('sorts institutions by name', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions');
      await expect(page.getByRole('link', { name: 'Nubank' })).toBeVisible();
      await page.locator('th.sortable', { hasText: 'Name' }).click();

      await expect(page).toHaveURL(/sort=name(\+| |%20)asc/);
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
    });

    test('paginates institutions', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { institutions: defaultInstitutions, perPage: 1 });

      await page.goto('/institutions?per_page=1');

      await expect(page.getByRole('link', { name: 'Nubank' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Itau' })).toHaveCount(0);

      await page.locator('.pagination-list').getByText('Next ›').click();

      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByRole('link', { name: 'Itau' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Nubank' })).toHaveCount(0);
    });

    test('returns to the list from the new form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/institutions/new');
      await page.getByRole('link', { name: 'Back' }).click();

      await expect(page).toHaveURL(/\/institutions$/);
      await expect(panelTitle(page)).toHaveText(/institutions/i);
    });
  });
});
