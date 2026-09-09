import type { Page } from '@playwright/test';
import { defaultTransactions } from './support/transactions';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelTitle(page: Page) {
  return page.locator('nav.panel .panel-heading-title');
}

async function chooseOption(page: Page, triggerName: string, option: string) {
  await page.getByRole('button', { name: triggerName }).click();
  await page.getByRole('option', { name: option }).click();
}

async function fillTransactionForm(
  page: Page,
  values: {
    description?: string;
    kind?: string;
    paymentMethod?: string;
    sourceAccount?: string;
    destinationAccount?: string;
    account?: string;
    creditCard?: string;
    recurrenceType?: string;
    limitConsumptionType?: string;
    startsOn?: string;
    endsOn?: string;
    installmentsCount?: string;
    value?: string;
    category?: string;
  },
) {
  if (values.description != null) {
    await page.locator('form input[name="description"]').fill(values.description);
  }

  if (values.kind) {
    await chooseOption(page, 'Kind *', values.kind);
  }

  if (values.paymentMethod) {
    await chooseOption(page, 'Payment method *', values.paymentMethod);
  }

  if (values.sourceAccount) {
    await chooseOption(page, 'Source account *', values.sourceAccount);
  }

  if (values.destinationAccount) {
    await chooseOption(page, 'Destination account *', values.destinationAccount);
  }

  if (values.account) {
    await chooseOption(page, 'Account *', values.account);
  }

  if (values.creditCard) {
    await chooseOption(page, 'Credit card *', values.creditCard);
  }

  if (values.recurrenceType) {
    await chooseOption(page, 'Recurrence *', values.recurrenceType);
  }

  if (values.limitConsumptionType) {
    await chooseOption(page, 'Limit consumption *', values.limitConsumptionType);
  }

  if (values.startsOn != null) {
    await page.locator('form input[name="startsOn"]').fill(values.startsOn);
  }

  if (values.endsOn != null) {
    await page.locator('form input[name="endsOn"]').fill(values.endsOn);
  }

  if (values.installmentsCount != null) {
    await page.locator('form input[name="installmentsCount"]').fill(values.installmentsCount);
  }

  if (values.value != null) {
    await page.locator('form input[name="value"]').fill(values.value);
  }

  if (values.category) {
    await chooseOption(page, 'Category *', values.category);
  }
}

test.describe('transactions', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/transactions');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('lists transactions', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');

      await expect(panelTitle(page)).toHaveText(/transactions/i);
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Groceries' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Utilities' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Netflix' })).toBeVisible();
    });

    test('shows an empty state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { transactions: [] });

      await page.goto('/transactions');

      await expect(page.getByText('No records found.')).toBeVisible();
    });

    test('creates an expense', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'New transaction' })).toBeVisible();
      await page.getByRole('link', { name: 'New transaction' }).click();

      await expect(panelTitle(page)).toHaveText(/new transaction/i);
      await fillTransactionForm(page, {
        description: 'Pharmacy',
        kind: 'Expense',
        paymentMethod: 'PIX',
        account: 'Checking',
        recurrenceType: 'One time',
        startsOn: '03/15/2026',
        value: '42.90',
        category: 'Food',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/transactions$/);
      await expect(page.getByText('Transaction was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Pharmacy' })).toBeVisible();
    });

    test('creates a transfer between accounts', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions/new');
      await fillTransactionForm(page, {
        description: 'Move to savings',
        kind: 'Transfer between accounts',
        sourceAccount: 'Checking',
        destinationAccount: 'Savings',
        recurrenceType: 'One time',
        startsOn: '03/15/2026',
        value: '200.00',
        category: 'Transport',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/transactions$/);
      await expect(page.getByText('Transaction was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Move to savings' })).toBeVisible();
    });

    test('creates a credit card expense', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions/new');
      await fillTransactionForm(page, {
        description: 'Bookstore',
        kind: 'Expense',
        paymentMethod: 'Credit card',
        creditCard: 'Platinum',
        recurrenceType: 'One time',
        startsOn: '03/15/2026',
        value: '59.90',
        category: 'Food',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/transactions$/);
      await expect(page.getByText('Transaction was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Bookstore' })).toBeVisible();
    });

    test('creates an income', async ({ page, baseURL }) => {
      const { transactions } = await setupApp(page, baseURL);

      await page.goto('/transactions/new');
      await fillTransactionForm(page, {
        description: 'Freelance',
        kind: 'Income',
        paymentMethod: 'Deposit',
        account: 'Checking',
        recurrenceType: 'One time',
        startsOn: '03/15/2026',
        value: '2500.00',
        category: 'Transport',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/transactions$/);
      await expect(page.getByText('Transaction was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Freelance' })).toBeVisible();

      const created = transactions.transactions.find((transaction) => transaction.description === 'Freelance');
      expect(created?.kind).toBe('income');
      expect(created?.paymentMethod).toBe('deposit');
      expect(created?.accountId).toBe('1');
    });

    test('creates a credit card installment', async ({ page, baseURL }) => {
      const { transactions } = await setupApp(page, baseURL);

      await page.goto('/transactions/new');
      await fillTransactionForm(page, {
        description: 'Laptop',
        kind: 'Expense',
        paymentMethod: 'Credit card',
        creditCard: 'Platinum',
        recurrenceType: 'Installment',
        limitConsumptionType: 'Monthly',
        startsOn: '03/15/2026',
        installmentsCount: '3',
        value: '3000.00',
        category: 'Food',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/transactions$/);
      await expect(page.getByText('Transaction was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Laptop' })).toBeVisible();

      const created = transactions.transactions.find((transaction) => transaction.description === 'Laptop');
      expect(created?.recurrenceType).toBe('installment');
      expect(created?.creditCardId).toBe('1');
      expect(created?.limitConsumptionType).toBe('monthly');
      expect(created?.endsOn).toBe('2026-05-15');
    });

    test('creates a category from the new transaction form', async ({ page, baseURL }) => {
      const { categories, transactions } = await setupApp(page, baseURL);

      await page.goto('/transactions/new');
      await fillTransactionForm(page, {
        description: 'Gym',
        kind: 'Expense',
        paymentMethod: 'PIX',
        account: 'Checking',
        recurrenceType: 'One time',
        startsOn: '03/15/2026',
        value: '99.00',
      });
      await page.getByRole('button', { name: 'New category' }).click();

      const modal = page.locator('.modal.is-active');
      await expect(modal).toBeVisible();
      await modal.locator('form input[name="name"]').fill('Health');
      await modal.getByRole('button', { name: 'Save' }).click();

      await expect(modal).toHaveCount(0);
      await expect(page.locator('button#categoryId')).toContainText('Health');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/transactions$/);
      await expect(page.getByText('Transaction was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Gym' })).toBeVisible();

      const category = categories.categories.find((item) => item.name === 'Health');
      const created = transactions.transactions.find((transaction) => transaction.description === 'Gym');
      expect(category).toBeTruthy();
      expect(created?.categoryId).toBe(category?.id);
    });

    test('validates a blank description when creating', async ({ page, baseURL }) => {
      const { transactions } = await setupApp(page, baseURL);
      const initialCount = transactions.transactions.length;

      await page.goto('/transactions/new');
      await fillTransactionForm(page, {
        kind: 'Expense',
        paymentMethod: 'PIX',
        account: 'Checking',
        recurrenceType: 'One time',
        startsOn: '03/15/2026',
        value: '10.00',
        category: 'Food',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/transactions\/new$/);
      expect(transactions.transactions).toHaveLength(initialCount);
    });

    test('validates that the destination account must differ', async ({ page, baseURL }) => {
      const { transactions } = await setupApp(page, baseURL);
      const initialCount = transactions.transactions.length;

      await page.goto('/transactions/new');
      await fillTransactionForm(page, {
        description: 'Invalid transfer',
        kind: 'Transfer between accounts',
        sourceAccount: 'Checking',
        destinationAccount: 'Checking',
        recurrenceType: 'One time',
        startsOn: '03/15/2026',
        value: '50.00',
        category: 'Food',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('must be different from the source account')).toBeVisible();
      await expect(page).toHaveURL(/\/transactions\/new$/);
      expect(transactions.transactions).toHaveLength(initialCount);
    });

    test('shows API errors when creating a duplicate transaction', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions/new');
      await fillTransactionForm(page, {
        description: 'Groceries',
        kind: 'Expense',
        paymentMethod: 'PIX',
        account: 'Checking',
        recurrenceType: 'One time',
        startsOn: '03/15/2026',
        value: '20.00',
        category: 'Food',
      });
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('has already been taken')).toBeVisible();
      await expect(page).toHaveURL(/\/transactions\/new$/);
    });

    test('edits a transaction', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await page.getByRole('link', { name: 'Groceries' }).click();

      await expect(page).toHaveURL(/\/transactions\/edit\//);
      await expect(page.getByText('Edit transaction', { exact: true })).toBeVisible();
      await expect(page.locator('form input[name="description"]')).toHaveValue('Groceries');

      await page.locator('form input[name="description"]').fill('Weekly groceries');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/transactions$/);
      await expect(page.getByText('Transaction was successfully updated.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Weekly groceries' })).toBeVisible();
    });

    test('deletes a pending transaction after confirmation', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Groceries' })).toBeVisible();
      await page.getByRole('row', { name: 'Groceries' }).locator('a.delete').click();

      await expect(page.locator('.modal.is-active')).toBeVisible();
      await expect(page.getByText(/remove the transaction "Groceries"/i)).toBeVisible();
      await page.locator('.modal.is-active').getByRole('button', { name: 'Yes', exact: true }).click();

      await expect(page.getByText('Transaction was successfully deleted.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Groceries' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
    });

    test('cancels deleting a transaction', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Groceries' })).toBeVisible();
      await page.getByRole('row', { name: 'Groceries' }).locator('a.delete').click();
      await page.locator('.modal.is-active').getByRole('button', { name: 'No', exact: true }).click();

      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Groceries' })).toBeVisible();
    });

    test('cancels an active transaction after confirmation', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Utilities' })).toBeVisible();
      await page.getByRole('row', { name: 'Utilities' }).locator('a.delete').click();

      await expect(page.locator('.modal.is-active')).toBeVisible();
      await expect(page.getByText(/cannot be deleted, only canceled/i)).toBeVisible();
      await page.locator('.modal.is-active').getByRole('button', { name: 'Yes', exact: true }).click();

      await expect(page.getByText('Transaction was successfully canceled.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Utilities' })).toBeVisible();
      await expect(page.getByRole('row', { name: 'Utilities' }).getByText('Canceled')).toBeVisible();
    });

    test('does not delete a completed transaction', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Netflix' })).toBeVisible();
      await page.getByRole('row', { name: 'Netflix' }).locator('a.delete').click();

      await expect(page.locator('.modal.is-active')).toBeVisible();
      await expect(page.getByText(/cannot be deleted due to the "Completed" status/i)).toBeVisible();
      await page.locator('.modal.is-active').getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Netflix' })).toBeVisible();
    });

    test('changes the value of an active recurring transaction', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await page.getByRole('link', { name: 'Utilities' }).click();

      await expect(page).toHaveURL(/\/transactions\/edit\//);
      await expect(page.getByText('Edit transaction', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Change' })).toBeVisible();
      await page.getByRole('button', { name: 'Change' }).click();

      const modal = page.locator('.modal.is-active');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('Change value', { exact: true })).toBeVisible();
      await modal.locator('input[name="value"]').fill('1500.00');
      await modal.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Transaction was successfully updated.')).toBeVisible();
      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      await expect(page.locator('form.form input[name="value"]')).toHaveValue('1,500.00');
    });

    test('changes the value for next months', async ({ page, baseURL }) => {
      const { transactions } = await setupApp(page, baseURL);

      await page.goto('/transactions');
      await page.getByRole('link', { name: 'Utilities' }).click();
      await page.getByRole('button', { name: 'Change' }).click();

      const modal = page.locator('.modal.is-active');
      await modal.locator('input[name="value"]').fill('1600.00');
      await modal.getByRole('checkbox', { name: 'Change value for next months' }).check();
      await modal.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Transaction was successfully updated.')).toBeVisible();
      await expect(page.locator('form.form input[name="value"]')).toHaveValue('1,600.00');

      const utilities = transactions.find('3');
      expect(utilities?.recurrences.at(-1)?.changeForNextMonths).toBe(true);
      expect(utilities?.recurrences.at(-1)?.value).toBe(1600);
    });

    test('validates a past start date when changing recurrence', async ({ page, baseURL }) => {
      const { transactions } = await setupApp(page, baseURL);
      const initialCount = transactions.find('3')?.recurrences.length ?? 0;

      await page.goto('/transactions');
      await page.getByRole('link', { name: 'Utilities' }).click();
      await page.getByRole('button', { name: 'Change' }).click();

      const modal = page.locator('.modal.is-active');
      await modal.locator('input[name="value"]').fill('1600.00');
      await modal.locator('input[name="startsOn"]').fill('08/01/2026');
      await modal.getByRole('button', { name: 'Save' }).click();

      await expect(modal.getByText('cannot be before the current month')).toBeVisible();
      await expect(modal).toBeVisible();
      expect(transactions.find('3')?.recurrences).toHaveLength(initialCount);
    });

    test('validates that the new recurrence value must differ', async ({ page, baseURL }) => {
      const { transactions } = await setupApp(page, baseURL);
      const initialCount = transactions.find('3')?.recurrences.length ?? 0;

      await page.goto('/transactions');
      await page.getByRole('link', { name: 'Utilities' }).click();
      await page.getByRole('button', { name: 'Change' }).click();

      const modal = page.locator('.modal.is-active');
      await modal.getByRole('button', { name: 'Save' }).click();

      await expect(modal.getByText('must be different from the previous recurrence value')).toBeVisible();
      await expect(modal).toBeVisible();
      expect(transactions.find('3')?.recurrences).toHaveLength(initialCount);
    });

    test('shows recurrence change history', async ({ page, baseURL }) => {
      const utilities = defaultTransactions.find((transaction) => transaction.description === 'Utilities');

      await setupApp(page, baseURL, {
        transactions: defaultTransactions.map((transaction) =>
          transaction.description === 'Utilities' && utilities
            ? {
                ...utilities,
                recurrences: [...utilities.recurrences, { id: '3-r2', startsOn: '2026-06-01', value: 1300 }],
                currentValue: 1300,
              }
            : transaction,
        ),
      });

      await page.goto('/transactions');
      await page.getByRole('link', { name: 'Utilities' }).click();

      await expect(page.getByRole('button', { name: 'Show change history' })).toBeVisible();
      await page.getByRole('button', { name: 'Show change history' }).click();

      const modal = page.locator('.modal.is-active');
      await expect(modal.getByText('Change history')).toBeVisible();
      await expect(modal.getByText('01/01/2026')).toBeVisible();
      await expect(modal.getByText('06/01/2026')).toBeVisible();
      await expect(modal.getByText('$1,200.00')).toBeVisible();
      await expect(modal.getByText('$1,300.00')).toBeVisible();
    });

    test('filters transactions by description', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();

      const filtered = page.waitForRequest((request) => {
        if (request.method() !== 'GET' || !request.url().includes('/api/v1/transactions')) {
          return false;
        }

        return new URL(request.url()).searchParams.get('q[description_cont]') === 'Salary';
      });

      await page.getByPlaceholder('Filter by description').fill('Salary');
      await filtered;

      await expect(page).toHaveURL(/description=Salary/);
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Groceries' })).toHaveCount(0);
    });

    test('filters transactions by kind', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by kind' }).click();
      await page.getByRole('option', { name: 'Income' }).click();

      await expect(page).toHaveURL(/kind=income/);
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Groceries' })).toHaveCount(0);
    });

    test('filters transactions by payment method', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by payment method' }).click();
      await page.getByRole('option', { name: 'Deposit' }).click();

      await expect(page).toHaveURL(/payment_method=deposit/);
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Groceries' })).toHaveCount(0);
    });

    test('filters transactions by recurrence', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by recurrence' }).click();
      await page.getByRole('option', { name: 'Recurring' }).click();

      await expect(page).toHaveURL(/recurrence_type=recurring/);
      await expect(page.getByRole('link', { name: 'Utilities' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Salary' })).toHaveCount(0);
    });

    test('filters transactions by status', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by status' }).click();
      await page.getByRole('option', { name: 'Completed' }).click();

      await expect(page).toHaveURL(/status=completed/);
      await expect(page.getByRole('link', { name: 'Netflix' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Salary' })).toHaveCount(0);
    });

    test('sorts transactions by description', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions');
      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await expect(page.locator('tbody tr').first().getByRole('link')).toHaveText('Salary');
      await page.locator('th.sortable', { hasText: 'Description' }).click();

      await expect(page).toHaveURL(/sort=description(\+| |%20)asc/);
      await expect(page.locator('tbody tr').first().getByRole('link')).toHaveText('Groceries');
    });

    test('paginates transactions', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { transactions: defaultTransactions, perPage: 1 });

      await page.goto('/transactions?per_page=1');

      await expect(page.getByRole('link', { name: 'Salary' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Groceries' })).toHaveCount(0);

      await page.locator('.pagination-list').getByText('Next ›').click();

      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByRole('link', { name: 'Groceries' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Salary' })).toHaveCount(0);
    });

    test('returns to the list from the new form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/transactions/new');
      await page.getByRole('link', { name: 'Back' }).click();

      await expect(page).toHaveURL(/\/transactions$/);
      await expect(panelTitle(page)).toHaveText(/transactions/i);
    });
  });
});
