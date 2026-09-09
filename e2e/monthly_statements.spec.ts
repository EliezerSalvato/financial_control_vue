import type { Page } from '@playwright/test';
import type { InvoiceSettlementRecord } from './support/credit_cards';
import type { SettledTransactionRecord, TransactionRecord } from './support/transactions';
import { defaultTransactions } from './support/transactions';
import {
  currentAppPeriod,
  defaultMonthlyStatements,
  defaultMonthlyStatementTransfers,
  isoDate,
  periodLabel,
  periodUrl,
  shiftPeriod,
} from './support/monthly_statements';
import { LAST_PROCESSED_AT, PROCESS_MONTH_MESSAGE } from './support/settlements';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelTitle(page: Page) {
  return page.locator('nav.panel .panel-heading-title');
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);

  return `${match?.[2]}/${match?.[3]}/${match?.[1]}`;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(new Date(iso));
}

function monthPickerLabel(month: number) {
  const label = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, month - 1, 1)));
  const trimmed = label.replace(/\.$/, '');

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function statementNamed(description: string) {
  return defaultMonthlyStatements().find((statement) => statement.description === description);
}

function groceriesSettlement(): SettledTransactionRecord {
  const groceries = statementNamed('Groceries');

  return {
    id: 's-2',
    transactionId: '2',
    categoryId: '1',
    description: 'Groceries',
    kind: 'expense',
    status: 'completed',
    paymentMethod: 'pix',
    recurrenceType: 'one_time',
    installmentsCount: null,
    endsOn: null,
    canceledOn: null,
    occurredOn: groceries?.currentRecurrenceOn ?? isoDate(currentAppPeriod(), 5),
    settledOn: groceries?.currentRecurrenceOn ?? isoDate(currentAppPeriod(), 5),
    value: groceries?.value ?? 85.5,
    installmentNumber: null,
    accountId: '1',
    creditCardId: null,
    limitConsumptionType: null,
    sourceAccountId: null,
    destinationAccountId: null,
  };
}

function transferSettlement(): SettledTransactionRecord {
  const transfer = defaultMonthlyStatementTransfers()[0];

  return {
    id: 's-10',
    transactionId: '10',
    categoryId: '1',
    description: 'Move to savings',
    kind: 'transfer_between_accounts',
    status: 'completed',
    paymentMethod: null,
    recurrenceType: 'one_time',
    installmentsCount: null,
    endsOn: null,
    canceledOn: null,
    occurredOn: transfer?.currentRecurrenceOn ?? isoDate(currentAppPeriod(), 3),
    settledOn: transfer?.currentRecurrenceOn ?? isoDate(currentAppPeriod(), 3),
    value: transfer?.value ?? 200,
    installmentNumber: null,
    accountId: null,
    creditCardId: null,
    limitConsumptionType: null,
    sourceAccountId: '1',
    destinationAccountId: '2',
  };
}

function platinumInvoice(): InvoiceSettlementRecord {
  const netflix = statementNamed('Netflix');

  return {
    id: 'inv-1',
    creditCardId: '1',
    paymentAccountId: '1',
    openingDate: netflix?.openingDate ?? isoDate(shiftPeriod(currentAppPeriod(), -1), 11),
    closingDate: netflix?.closingDate ?? isoDate(currentAppPeriod(), 10),
    dueDate: netflix?.dueDate ?? isoDate(currentAppPeriod(), 17),
    totalValue: netflix?.value ?? 45.9,
    releasedLimit: netflix?.value ?? 45.9,
    settledOn: netflix?.dueDate ?? isoDate(currentAppPeriod(), 17),
  };
}

function transferTransaction(): TransactionRecord {
  const transfer = defaultMonthlyStatementTransfers()[0];
  const occurredOn = transfer?.currentRecurrenceOn ?? isoDate(currentAppPeriod(), 3);

  return {
    id: '10',
    categoryId: '1',
    description: 'Move to savings',
    kind: 'transfer_between_accounts',
    status: 'pending',
    paymentMethod: null,
    recurrenceType: 'one_time',
    installmentsCount: null,
    endsOn: null,
    accountId: null,
    creditCardId: null,
    limitConsumptionType: null,
    sourceAccountId: '1',
    destinationAccountId: '2',
    tagIds: [],
    recurrences: [{ id: '10-r1', startsOn: occurredOn, value: transfer?.value ?? 200 }],
    currentValue: transfer?.value ?? 200,
    createdAt: `${occurredOn}T10:00:00.000Z`,
  };
}

test.describe('monthly statements', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('redirects to the current period', async ({ page, baseURL }) => {
      const current = currentAppPeriod();

      await setupApp(page, baseURL);

      await page.goto('/');

      await expect(page).toHaveURL(new RegExp(`[?&]month=${current.month}`));
      await expect(page).toHaveURL(new RegExp(`[?&]year=${current.year}`));
      await expect(page.getByLabel('Current month and year')).toHaveText(periodLabel(current));
    });

    test('lists incomes, expenses and balance', async ({ page, baseURL }) => {
      const current = currentAppPeriod();

      await setupApp(page, baseURL);

      await page.goto(periodUrl(current));

      await expect(page.locator('.month-status')).toContainText('Open');
      await expect(page.getByRole('button', { name: 'Change status to closed' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Process month' })).toBeVisible();
      await expect(page.getByLabel('Has not been processed yet')).toBeVisible();

      const incomes = page.locator('.incomes-board');
      await expect(incomes.getByText('Incomes')).toBeVisible();
      await expect(incomes).toContainText('Checking');
      await expect(incomes).toContainText(formatMoney(5000));

      const expenses = page.locator('.expenses-board');
      await expect(expenses.getByText('Expenses')).toBeVisible();
      await expect(expenses.getByText('Checking')).toBeVisible();
      await expect(expenses.getByText('Platinum')).toBeVisible();
      await expect(expenses.getByText(formatMoney(85.5))).toBeVisible();
      await expect(expenses.getByText(formatMoney(45.9))).toBeVisible();
      await expect(expenses.getByText(formatMoney(131.4))).toBeVisible();

      await expect(page.locator('.balance')).toContainText(formatMoney(4868.6));
    });

    test('shows empty states', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { monthlyStatements: [], monthlyStatementTransfers: [] });

      await page.goto(periodUrl(currentAppPeriod()));

      await expect(page.getByText('No incomes found.')).toBeVisible();
      await expect(page.getByText('No expenses found.')).toBeVisible();
      await expect(page.locator('.balance')).toContainText(formatMoney(0));
    });

    test('expands an account group and opens a transaction', async ({ page, baseURL }) => {
      const groceries = statementNamed('Groceries');

      await setupApp(page, baseURL);

      await page.goto(periodUrl(currentAppPeriod()));
      await page.locator('.expenses-board tr', { hasText: 'Checking' }).getByRole('button', { name: 'Show transactions' }).click();

      await expect(page.getByRole('link', { name: 'Groceries' })).toBeVisible();
      await expect(page.locator('.expenses-board')).toContainText(formatDate(groceries?.currentRecurrenceOn ?? ''));
      await page.getByRole('link', { name: 'Groceries' }).click();

      await expect(page).toHaveURL(/\/transactions\/edit\/2/);
      await expect(panelTitle(page)).toHaveText(/edit transaction/i);
      await expect(page.locator('form input[name="description"]')).toHaveValue('Groceries');
    });

    test('expands a credit card group', async ({ page, baseURL }) => {
      const netflix = statementNamed('Netflix');

      await setupApp(page, baseURL);

      await page.goto(periodUrl(currentAppPeriod()));

      const expenses = page.locator('.expenses-board');
      await expect(expenses.getByText(`Due date: ${formatDate(netflix?.dueDate ?? '')}`)).toBeVisible();
      await expenses.locator('tr', { hasText: 'Platinum' }).getByRole('button', { name: 'Show transactions' }).click();

      await expect(expenses.getByText(`Opening: ${formatDate(netflix?.openingDate ?? '')}`)).toBeVisible();
      await expect(expenses.getByText(`Closing: ${formatDate(netflix?.closingDate ?? '')}`)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Netflix' })).toBeVisible();
    });

    test('opens a new income form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto(periodUrl(currentAppPeriod()));
      await page.getByRole('link', { name: 'New income' }).click();

      await expect(page).toHaveURL(/\/transactions\/new\?kind=income/);
      await expect(panelTitle(page)).toHaveText(/new transaction/i);
      await expect(page.locator('button.custom-select-trigger').filter({ hasText: 'Income' })).toBeVisible();
    });

    test('opens a new expense form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto(periodUrl(currentAppPeriod()));
      await page.getByRole('link', { name: 'New expense' }).click();

      await expect(page).toHaveURL(/\/transactions\/new\?kind=expense/);
      await expect(panelTitle(page)).toHaveText(/new transaction/i);
      await expect(page.locator('button.custom-select-trigger').filter({ hasText: 'Expense' })).toBeVisible();
    });

    test('opens a new transfer form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto(periodUrl(currentAppPeriod()));
      await page.getByRole('link', { name: 'New transfer' }).click();

      await expect(page).toHaveURL(/\/transactions\/new\?kind=transfer_between_accounts/);
      await expect(panelTitle(page)).toHaveText(/new transaction/i);
      await expect(page.locator('button.custom-select-trigger').filter({ hasText: 'Transfer between accounts' })).toBeVisible();
    });

    test('lists transfers', async ({ page, baseURL }) => {
      const transfer = defaultMonthlyStatementTransfers()[0];

      await setupApp(page, baseURL);

      await page.goto(periodUrl(currentAppPeriod()));
      await page.getByRole('button', { name: 'Show transfers' }).click();

      await expect(page.getByRole('link', { name: 'Move to savings' })).toBeVisible();
      await expect(page.locator('.transfers-panel')).toContainText(formatDate(transfer?.currentRecurrenceOn ?? ''));
      await expect(page.locator('.transfers-panel')).toContainText('Checking');
      await expect(page.locator('.transfers-panel')).toContainText('Savings');
      await expect(page.locator('.transfers-panel')).toContainText(formatMoney(200));
    });

    test('opens a transfer', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { transactions: [...defaultTransactions, transferTransaction()] });

      await page.goto(periodUrl(currentAppPeriod()));
      await page.getByRole('button', { name: 'Show transfers' }).click();
      await page.getByRole('link', { name: 'Move to savings' }).click();

      await expect(page).toHaveURL(/\/transactions\/edit\/10/);
      await expect(panelTitle(page)).toHaveText(/edit transaction/i);
      await expect(page.locator('form input[name="description"]')).toHaveValue('Move to savings');
    });

    test('shows empty transfers', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { monthlyStatementTransfers: [] });

      await page.goto(periodUrl(currentAppPeriod()));
      await page.getByRole('button', { name: 'Show transfers' }).click();

      await expect(page.locator('.transfers-panel td.is-hidden-touch', { hasText: 'No transfers found.' })).toBeVisible();
    });

    test('navigates to the previous month', async ({ page, baseURL }) => {
      const current = currentAppPeriod();
      const previous = shiftPeriod(current, -1);

      await setupApp(page, baseURL);

      await page.goto(periodUrl(current));
      await expect(page.locator('.incomes-board')).toContainText(formatMoney(5000));
      await page.locator('.date-chosen-nav').getByRole('button', { name: '‹ Prev' }).click();

      await expect(page).toHaveURL(new RegExp(`[?&]month=${previous.month}`));
      await expect(page).toHaveURL(new RegExp(`[?&]year=${previous.year}`));
      await expect(page.getByLabel('Current month and year')).toHaveText(periodLabel(previous));
      await expect(page.locator('.incomes-board')).toContainText(formatMoney(1000));
      await expect(page.getByText('No expenses found.')).toBeVisible();
    });

    test('does not allow managing a future month', async ({ page, baseURL }) => {
      const next = shiftPeriod(currentAppPeriod(), 1);

      await setupApp(page, baseURL);

      await page.goto(periodUrl(next));

      await expect(page.getByLabel('Current month and year')).toHaveText(periodLabel(next));
      await expect(page.getByText('No incomes found.')).toBeVisible();
      await expect(page.getByText('No expenses found.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Process month' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Change status to closed' })).toHaveCount(0);
    });

    test('selects a period from the picker', async ({ page, baseURL }) => {
      const current = currentAppPeriod();
      const previous = shiftPeriod(current, -1);

      await setupApp(page, baseURL);

      await page.goto(periodUrl(current));
      await page.getByLabel('Current month and year').click();

      await expect(page.getByRole('dialog', { name: 'Select year' })).toBeVisible();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: String(previous.year), exact: true })
        .click();
      await expect(page.getByRole('dialog', { name: 'Select month' })).toBeVisible();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: monthPickerLabel(previous.month), exact: true })
        .click();

      await expect(page).toHaveURL(new RegExp(`[?&]month=${previous.month}`));
      await expect(page).toHaveURL(new RegExp(`[?&]year=${previous.year}`));
      await expect(page.locator('.incomes-board')).toContainText(formatMoney(1000));
    });

    test('closes the month after confirmation', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto(periodUrl(currentAppPeriod()));
      await page.getByRole('button', { name: 'Change status to closed' }).click();

      await expect(page.locator('.modal.is-active')).toBeVisible();
      await expect(page.getByText(/close this month/i)).toBeVisible();
      await page.locator('.modal.is-active').getByRole('button', { name: 'Yes', exact: true }).click();

      await expect(page.getByText('Month was successfully closed.')).toBeVisible();
      await expect(page.locator('.month-status')).toContainText('Closed');
      await expect(page.getByRole('button', { name: 'Process month' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Change status to closed' })).toHaveCount(0);
    });

    test('cancels closing the month', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto(periodUrl(currentAppPeriod()));
      await page.getByRole('button', { name: 'Change status to closed' }).click();
      await page.locator('.modal.is-active').getByRole('button', { name: 'No', exact: true }).click();

      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      await expect(page.locator('.month-status')).toContainText('Open');
      await expect(page.getByRole('button', { name: 'Process month' })).toBeVisible();
    });

    test('does not allow managing an earlier month when a later month is closed', async ({ page, baseURL }) => {
      const current = currentAppPeriod();
      const previous = shiftPeriod(current, -1);

      await setupApp(page, baseURL, {
        monthlyStatuses: [
          { id: '1', month: current.month, year: current.year, status: 'closed', processing: false, lastProcessedAt: LAST_PROCESSED_AT },
          { id: '2', month: previous.month, year: previous.year, status: 'open', processing: false, lastProcessedAt: null },
        ],
      });

      await page.goto(periodUrl(previous));

      await expect(page.locator('.month-status')).toContainText('Open');
      await expect(page.locator('.incomes-board')).toContainText(formatMoney(1000));
      await expect(page.getByRole('button', { name: 'Process month' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Change status to closed' })).toHaveCount(0);
    });

    test('processes the month', async ({ page, baseURL }) => {
      const current = currentAppPeriod();
      const { cable } = await setupApp(page, baseURL);

      await page.goto(periodUrl(current));
      await expect(page.getByLabel('Has not been processed yet')).toBeVisible();
      await page.getByRole('button', { name: 'Process month' }).click();

      await expect(page.getByText(PROCESS_MONTH_MESSAGE)).toBeVisible();
      cable.sendToChannel(
        { channel: 'MonthlyStatusChannel', month: current.month, year: current.year },
        { processing: false, last_processed_at: LAST_PROCESSED_AT },
      );

      await expect(page.getByLabel(`Last processed at ${formatDateTime(LAST_PROCESSED_AT)}`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Process month' })).toBeEnabled();
    });

    test('shows settled marks', async ({ page, baseURL }) => {
      const groceries = groceriesSettlement();
      const transfer = transferSettlement();
      const invoice = platinumInvoice();

      await setupApp(page, baseURL, {
        settledTransactions: [groceries, transfer],
        invoiceSettlements: [invoice],
      });

      await page.goto(periodUrl(currentAppPeriod()));

      await expect(page.getByLabel(`Invoice paid on ${formatDate(invoice.settledOn)}`)).toBeVisible();
      await page.locator('.expenses-board tr', { hasText: 'Checking' }).getByRole('button', { name: 'Show transactions' }).click();
      await expect(page.getByLabel(`Settled on ${formatDate(groceries.settledOn)}`)).toBeVisible();

      await page.getByRole('button', { name: 'Show transfers' }).click();
      await expect(page.getByRole('link', { name: 'Move to savings' })).toBeVisible();
      await expect(page.locator('.transfers-panel').getByLabel(`Settled on ${formatDate(transfer.settledOn)}`)).toBeVisible();
    });
  });
});
