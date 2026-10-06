import type { Page } from '@playwright/test';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelTitle(page: Page) {
  return page.locator('nav.panel .panel-heading-title');
}

async function chooseOption(page: Page, triggerName: string, option: string) {
  await page.getByRole('button', { name: triggerName }).click();
  await page.getByRole('option', { name: option }).click();
}

test.describe('import rules', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/import-rules');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('lists import rules', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/import-rules');

      await expect(panelTitle(page)).toHaveText(/import rules/i);
      await expect(page.getByRole('link', { name: 'Uber rides' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Skip transfers' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Old rule' })).toBeVisible();
      await expect(page.getByRole('row', { name: 'Uber rides' }).getByText('Set category')).toBeVisible();
    });

    test('shows an empty state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { importRules: [] });

      await page.goto('/import-rules');

      await expect(page.getByText('No records found.')).toBeVisible();
    });

    test('filters import rules by name', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/import-rules');
      await expect(page.getByRole('link', { name: 'Uber rides' })).toBeVisible();
      await page.locator('input[name="name"]').first().fill('skip');

      await expect(page.getByRole('link', { name: 'Skip transfers' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Uber rides' })).toHaveCount(0);
    });

    test('requires a name, a pattern and at least one effect', async ({ page, baseURL }) => {
      const { importRules } = await setupApp(page, baseURL);

      await page.goto('/import-rules/new');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/import-rules\/new$/);
      await expect(page.getByText('Add at least one effect')).toBeVisible();
      expect(importRules.rules).toHaveLength(3);
    });

    test('creates an import rule', async ({ page, baseURL }) => {
      const { importRules } = await setupApp(page, baseURL);

      await page.goto('/import-rules');
      await page.getByRole('link', { name: 'New import rule' }).click();

      await expect(panelTitle(page)).toHaveText(/new import rule/i);
      await page.locator('form input[name="name"]').fill('Netflix');
      await page.locator('form input[name="pattern"]').fill('netflix');
      await page.getByRole('button', { name: 'Add effect' }).click();
      await chooseOption(page, 'Select an effect', 'Set category');
      await page.locator('#categoryId-0').click();
      await page.getByRole('option', { name: 'Food' }).click();
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/import-rules$/);
      await expect(page.getByText('Import rule was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Netflix' })).toBeVisible();
      expect(importRules.lastPayload).toMatchObject({
        name: 'Netflix',
        pattern: 'netflix',
        position: 3,
        active: true,
        match_type: 'contains',
        effects: [{ effect_type: 'set_category', category_id: '1' }],
      });
    });

    test('edits an import rule', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/import-rules');
      await page.getByRole('link', { name: 'Uber rides' }).click();

      await expect(panelTitle(page)).toHaveText(/edit import rule/i);
      await expect(page.locator('form input[name="name"]')).toHaveValue('Uber rides');
      await expect(page.locator('form input[name="pattern"]')).toHaveValue('uber');
      await page.locator('form input[name="name"]').fill('Ride sharing');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/import-rules$/);
      await expect(page.getByText('Import rule was successfully updated.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Ride sharing' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Uber rides' })).toHaveCount(0);
    });

    test('deletes an import rule after confirmation', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/import-rules');
      await expect(page.getByRole('link', { name: 'Old rule' })).toBeVisible();
      await page.getByRole('row', { name: 'Old rule' }).locator('a.delete').click();

      await expect(page.locator('.modal.is-active')).toBeVisible();
      await expect(page.getByText(/"Old rule"/)).toBeVisible();
      await page.locator('.modal.is-active').getByRole('button', { name: 'Yes', exact: true }).click();

      await expect(page.getByText('Import rule was successfully deleted.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Old rule' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Uber rides' })).toBeVisible();
    });

    test('cancels deleting an import rule', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/import-rules');
      await expect(page.getByRole('link', { name: 'Old rule' })).toBeVisible();
      await page.getByRole('row', { name: 'Old rule' }).locator('a.delete').click();
      await page.locator('.modal.is-active').getByRole('button', { name: 'No', exact: true }).click();

      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Old rule' })).toBeVisible();
    });
  });
});
