import type { Page } from '@playwright/test';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

const csv = {
  name: 'statement.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from('date,title,amount\n2026-09-10,Uber trip,45.90\n2026-09-12,Supermarket,230.00\n2026-09-15,Gym,99.90\n'),
};

async function chooseOption(page: Page, triggerName: string, option: string) {
  await page.getByRole('button', { name: triggerName }).click();
  await page.getByRole('option', { name: option }).click();
}

async function openImportModal(page: Page) {
  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Import from CSV' }).click();

  const modal = page.locator('.modal.is-active');
  await expect(modal).toBeVisible();

  return modal;
}

async function fillImportModal(page: Page) {
  await chooseOption(page, 'Kind *', 'Expense');
  await chooseOption(page, 'Payment method *', 'Pix');
  await chooseOption(page, 'Account *', 'Checking');
  await page.locator('#importFile').setInputFiles(csv);
}

async function goToReviewPage(page: Page) {
  const modal = await openImportModal(page);

  await fillImportModal(page);
  await modal.getByRole('button', { name: 'Import', exact: true }).click();

  await expect(page).toHaveURL(/\/transactions\/import$/);
  await expect(page.locator('nav.panel .panel-heading-title')).toHaveText('Review import');
}

test.describe('transactions import', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/transactions/import');

    await expect(page).toHaveURL(/\/users\/sign-in/);
  });

  test.describe('when signed in', () => {
    test('goes back to transactions when there is no preview to review', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions/import');

      await expect(page).toHaveURL(/\/transactions$/);
    });

    test('links to the import rules', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await page.getByRole('link', { name: 'Import rules' }).click();

      await expect(page).toHaveURL(/\/import-rules$/);
    });

    test('requires kind, payment method and file before importing', async ({ page, baseURL }) => {
      const { transactionImports } = await setupApp(page, baseURL);
      const modal = await openImportModal(page);

      await modal.getByRole('button', { name: 'Import', exact: true }).click();

      await expect(modal.locator('.help.is-danger').first()).toBeVisible();
      await expect(page).toHaveURL(/\/transactions$/);
      expect(transactionImports.previewRequests).toHaveLength(0);
    });

    test('limits the payment methods to the selected kind', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);
      const modal = await openImportModal(page);

      await expect(modal.getByRole('button', { name: 'Payment method *' })).toBeDisabled();

      await chooseOption(page, 'Kind *', 'Income');
      await page.getByRole('button', { name: 'Payment method *' }).click();

      await expect(page.getByRole('option', { name: 'Deposit' })).toBeVisible();
      await expect(page.getByRole('option', { name: 'Debit' })).toHaveCount(0);
    });

    test('asks for a credit card when the payment method is credit card', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);
      const modal = await openImportModal(page);

      await chooseOption(page, 'Kind *', 'Expense');
      await chooseOption(page, 'Payment method *', 'Credit card');

      await expect(modal.getByRole('button', { name: 'Credit card *' })).toBeVisible();
      await expect(modal.getByRole('button', { name: 'Account *' })).toHaveCount(0);
    });

    test('uploads the file and opens the review page with the previewed rows', async ({ page, baseURL }) => {
      const { transactionImports } = await setupApp(page, baseURL);

      await goToReviewPage(page);

      expect(transactionImports.previewRequests).toEqual([
        { kind: 'expense', paymentMethod: 'pix', accountId: '1', creditCardId: '', fileName: 'statement.csv' },
      ]);
      await expect(page.locator('input[name="description-1"]')).toHaveValue('Uber trip');
      await expect(page.locator('input[name="description-2"]')).toHaveValue('Supermarket');
      await expect(page.locator('input[name="description-3"]')).toHaveValue('Gym');
      await expect(page.getByRole('button', { name: 'Import 3 transactions' })).toBeEnabled();
    });

    test('shows an error when the preview request fails', async ({ page, baseURL }) => {
      const { transactionImports } = await setupApp(page, baseURL);
      transactionImports.failPreviewWith = { file: ['is not a valid CSV'] };
      const modal = await openImportModal(page);

      await fillImportModal(page);
      await modal.getByRole('button', { name: 'Import', exact: true }).click();

      await expect(modal.getByText('is not a valid CSV')).toBeVisible();
      await expect(page).toHaveURL(/\/transactions$/);
    });

    test('warns when no row can be reviewed', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, {
        importPreviewRows: [
          { row: 1, date: '2026-09-10', description: 'Uber trip', amount: '45.90', status: 'skip' },
          { row: 2, date: '2026-09-12', description: 'Supermarket', amount: '230.00', status: 'error', error: 'Invalid amount' },
        ],
      });
      const modal = await openImportModal(page);

      await fillImportModal(page);
      await modal.getByRole('button', { name: 'Import', exact: true }).click();

      await expect(modal.getByText('No new rows to review')).toBeVisible();
      await expect(modal.getByText('1 with errors')).toBeVisible();
      await expect(page).toHaveURL(/\/transactions$/);
    });

    test('imports every previewed row', async ({ page, baseURL }) => {
      const { transactionImports } = await setupApp(page, baseURL);

      await goToReviewPage(page);
      await page.getByRole('button', { name: 'Import 3 transactions' }).click();

      await expect(page.getByText('3 created')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Back to transactions' })).toBeVisible();
      expect(transactionImports.confirmRequests).toHaveLength(1);
      expect(transactionImports.confirmRequests[0]).toMatchObject({
        import_id: 'import-1',
        rows: [
          { row: 1, create: true, description: 'Uber trip', amount: '45.90', category_id: '2' },
          { row: 2, create: true, description: 'Supermarket', amount: '230.00', category_id: '1' },
          { row: 3, create: true, description: 'Gym', amount: '99.90', category_name: 'Health' },
        ],
      });
    });

    test('sends the edits made on the review page', async ({ page, baseURL }) => {
      const { transactionImports } = await setupApp(page, baseURL);

      await goToReviewPage(page);
      await page.locator('input[name="description-2"]').fill('Weekly groceries');
      await page.getByRole('button', { name: 'Import 3 transactions' }).click();

      await expect(page.getByText('3 created')).toBeVisible();
      expect(transactionImports.confirmRequests[0].rows[1]).toMatchObject({ row: 2, description: 'Weekly groceries' });
    });

    test('does not import unselected rows', async ({ page, baseURL }) => {
      const { transactionImports } = await setupApp(page, baseURL);

      await goToReviewPage(page);
      await page.locator('input[name="create-2"]').uncheck();

      await expect(page.getByRole('button', { name: 'Import 2 transactions' })).toBeEnabled();
      await page.getByRole('button', { name: 'Import 2 transactions' }).click();

      await expect(page.getByText('2 created')).toBeVisible();
      expect(transactionImports.confirmRequests[0].rows.filter((row) => row.create).map((row) => row.row)).toEqual([1, 3]);
    });

    test('blocks the import while a selected row is invalid', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await goToReviewPage(page);
      await page.locator('input[name="description-1"]').fill('');

      await expect(page.getByText(/Fill in date, description, value and category/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Import 3 transactions' })).toBeDisabled();

      await page.locator('input[name="create-1"]').uncheck();

      await expect(page.getByRole('button', { name: 'Import 2 transactions' })).toBeEnabled();
    });

    test('selects and unselects every row at once', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await goToReviewPage(page);
      await page.getByTitle('Select all').uncheck();

      await expect(page.getByRole('button', { name: 'Import 0 transactions' })).toBeDisabled();

      await page.getByTitle('Select all').check();

      await expect(page.getByRole('button', { name: 'Import 3 transactions' })).toBeEnabled();
    });

    test('filters the rows by description', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await goToReviewPage(page);
      await page.locator('input[name="filterDescription"]').fill('gym');

      await expect(page.locator('input[name="description-3"]')).toBeVisible();
      await expect(page.locator('input[name="description-1"]')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Import 1 transactions' })).toBeEnabled();
    });

    test('reports the failure when confirming the import fails', async ({ page, baseURL }) => {
      const { transactionImports } = await setupApp(page, baseURL);

      await goToReviewPage(page);
      transactionImports.failConfirm = true;
      await page.getByRole('button', { name: 'Import 3 transactions' }).click();

      await expect(page.getByText('Import failed')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Import 3 transactions' })).toBeEnabled();
    });
  });
});
