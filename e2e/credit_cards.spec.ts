import type { Page } from '@playwright/test';
import { defaultCreditCards } from './support/credit_cards';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelTitle(page: Page) {
  return page.locator('nav.panel .panel-heading-title');
}

async function chooseOption(page: Page, triggerName: string, option: string) {
  await page.getByRole('button', { name: triggerName }).click();
  await page.getByRole('option', { name: option }).click();
}

async function fillCreditCardForm(
  page: Page,
  values: {
    name?: string;
    institution?: string;
    account?: string;
    network?: string;
    closingDay?: string;
    dueDay?: string;
  },
) {
  if (values.name != null) {
    await page.locator('form input[name="name"]').fill(values.name);
  }

  if (values.institution) {
    await chooseOption(page, 'Institution *', values.institution);
  }

  if (values.account) {
    await chooseOption(page, 'Default payment account *', values.account);
  }

  if (values.network) {
    await chooseOption(page, 'Network *', values.network);
  }

  if (values.closingDay != null) {
    await page.locator('form input[name="closingDay"]').fill(values.closingDay);
  }

  if (values.dueDay != null) {
    await page.locator('form input[name="dueDay"]').fill(values.dueDay);
  }
}

test.describe('credit cards', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/credit-cards');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('lists credit cards', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards');

      await expect(panelTitle(page)).toHaveText(/credit cards/i);
      await expect(page.getByRole('link', { name: 'Platinum' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Gold' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
    });

    test('shows an empty state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { creditCards: [] });

      await page.goto('/credit-cards');

      await expect(page.getByText('No records found.')).toBeVisible();
    });

    test('creates a credit card', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards');
      await expect(page.getByRole('link', { name: 'New credit card' })).toBeVisible();
      await page.getByRole('link', { name: 'New credit card' }).click();

      await expect(panelTitle(page)).toHaveText(/new credit card/i);
      await fillCreditCardForm(page, {
        name: 'Infinite',
        institution: 'Nubank',
        account: 'Checking',
        network: 'Visa',
        closingDay: '10',
        dueDay: '17',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/credit-cards$/);
      await expect(page.getByText('Credit card was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Infinite' })).toBeVisible();
    });

    test('validates a blank name when creating', async ({ page, baseURL }) => {
      const { creditCards } = await setupApp(page, baseURL);
      const initialCount = creditCards.creditCards.length;

      await page.goto('/credit-cards/new');
      await fillCreditCardForm(page, {
        institution: 'Nubank',
        account: 'Checking',
        network: 'Visa',
        closingDay: '10',
        dueDay: '17',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/credit-cards\/new$/);
      expect(creditCards.creditCards).toHaveLength(initialCount);
    });

    test('validates a blank institution when creating', async ({ page, baseURL }) => {
      const { creditCards } = await setupApp(page, baseURL);
      const initialCount = creditCards.creditCards.length;

      await page.goto('/credit-cards/new');
      await fillCreditCardForm(page, {
        name: 'Infinite',
        account: 'Checking',
        network: 'Visa',
        closingDay: '10',
        dueDay: '17',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/credit-cards\/new$/);
      expect(creditCards.creditCards).toHaveLength(initialCount);
    });

    test('shows API errors when creating a duplicate credit card', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards/new');
      await fillCreditCardForm(page, {
        name: 'Platinum',
        institution: 'Nubank',
        account: 'Checking',
        network: 'Visa',
        closingDay: '10',
        dueDay: '17',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('has already been taken')).toBeVisible();
      await expect(page).toHaveURL(/\/credit-cards\/new$/);
    });

    test('edits a credit card', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards');
      await page.getByRole('link', { name: 'Platinum' }).click();

      await expect(panelTitle(page)).toHaveText(/edit credit card/i);
      await expect(page.locator('form input[name="name"]')).toHaveValue('Platinum');
      await expect(page.getByRole('checkbox', { name: 'Active' })).toBeChecked();

      await page.locator('form input[name="name"]').fill('Platinum Rewards');
      await page.getByRole('checkbox', { name: 'Active' }).uncheck();
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/credit-cards$/);
      await expect(page.getByText('Credit card was successfully updated.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Platinum Rewards' })).toBeVisible();
    });

    test('deletes a credit card after confirmation', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards');
      await expect(page.getByRole('link', { name: 'Gold' })).toBeVisible();
      await page.getByRole('row', { name: 'Gold' }).locator('a.delete').click();

      await expect(page.locator('.modal.is-active')).toBeVisible();
      await expect(page.getByText(/remove the credit card "Gold"/i)).toBeVisible();
      await page.locator('.modal.is-active').getByRole('button', { name: 'Yes', exact: true }).click();

      await expect(page.getByText('Credit card was successfully deleted.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Gold' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Platinum' })).toBeVisible();
    });

    test('cancels deleting a credit card', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards');
      await expect(page.getByRole('link', { name: 'Gold' })).toBeVisible();
      await page.getByRole('row', { name: 'Gold' }).locator('a.delete').click();
      await page.locator('.modal.is-active').getByRole('button', { name: 'No', exact: true }).click();

      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Gold' })).toBeVisible();
    });

    test('filters credit cards by name', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards');
      await expect(page.getByRole('link', { name: 'Platinum' })).toBeVisible();

      const filtered = page.waitForRequest((request) => {
        if (request.method() !== 'GET' || !request.url().includes('/api/v1/credit_cards')) {
          return false;
        }

        return new URL(request.url()).searchParams.get('q[name_cont]') === 'Platinum';
      });

      await page.getByPlaceholder('Filter by name').fill('Platinum');
      await filtered;

      await expect(page).toHaveURL(/name=Platinum/);
      await expect(page.getByRole('link', { name: 'Platinum' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Gold' })).toHaveCount(0);
    });

    test('filters credit cards by active state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards');
      await expect(page.getByRole('link', { name: 'Platinum' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by active' }).click();
      await page.getByRole('option', { name: 'Inactive' }).click();

      await expect(page).toHaveURL(/active=false/);
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Platinum' })).toHaveCount(0);
    });

    test('sorts credit cards by name', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards');
      await expect(page.getByRole('link', { name: 'Platinum' })).toBeVisible();
      await page.locator('th.sortable', { hasText: 'Name' }).click();

      await expect(page).toHaveURL(/sort=name(\+| |%20)asc/);
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
    });

    test('paginates credit cards', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { creditCards: defaultCreditCards, perPage: 1 });

      await page.goto('/credit-cards?per_page=1');

      await expect(page.getByRole('link', { name: 'Platinum' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Gold' })).toHaveCount(0);

      await page.locator('.pagination-list').getByText('Next ›').click();

      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByRole('link', { name: 'Gold' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Platinum' })).toHaveCount(0);
    });

    test('returns to the list from the new form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/credit-cards/new');
      await page.getByRole('link', { name: 'Back' }).click();

      await expect(page).toHaveURL(/\/credit-cards$/);
      await expect(panelTitle(page)).toHaveText(/credit cards/i);
    });
  });
});
