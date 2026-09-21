import type { Page } from '@playwright/test';
import { defaultCategories } from './support/categories';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelTitle(page: Page) {
  return page.locator('nav.panel .panel-heading-title');
}

test.describe('categories', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/categories');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('lists categories', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories');

      await expect(panelTitle(page)).toHaveText(/categories/i);
      await expect(page.getByRole('link', { name: 'Food' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Transport' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
    });

    test('shows an empty state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { categories: [] });

      await page.goto('/categories');

      await expect(page.getByText('No records found.')).toBeVisible();
    });

    test('creates a category', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories');
      await expect(page.getByRole('link', { name: 'New category' })).toBeVisible();
      await page.getByRole('link', { name: 'New category' }).click();

      await expect(panelTitle(page)).toHaveText(/new category/i);
      await page.locator('form input[name="name"]').fill('Health');
      await page.locator('form input[name="color"]').fill('#336699');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/categories$/);
      await expect(page.getByText('Category was successfully created.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Health' })).toBeVisible();
    });

    test('validates a blank name when creating', async ({ page, baseURL }) => {
      const { categories } = await setupApp(page, baseURL);
      const initialCount = categories.categories.length;

      await page.goto('/categories/new');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/categories\/new$/);
      expect(categories.categories).toHaveLength(initialCount);
    });

    test('shows API errors when creating a duplicate category', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories/new');
      await page.locator('form input[name="name"]').fill('Food');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('has already been taken')).toBeVisible();
      await expect(page).toHaveURL(/\/categories\/new$/);
    });

    test('creates a category with a monthly goal', async ({ page, baseURL }) => {
      const { categories } = await setupApp(page, baseURL);

      await page.goto('/categories/new');
      await page.locator('form input[name="name"]').fill('Health');
      await page.locator('form input[name="goalStartsOn"]').fill('07/2026');
      await page.locator('form input[name="goalValue"]').fill('500.00');
      await page.locator('form input[name="goalEndsOn"]').fill('12/2026');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/categories$/);
      await expect(page.getByText('Category was successfully created.')).toBeVisible();

      const created = categories.categories.find((category) => category.name === 'Health');
      expect(created?.goalEndsOn).toBe('2026-12-01');
      expect(created?.goals).toEqual([expect.objectContaining({ month: 7, year: 2026, value: 500 })]);
    });

    test('validates an incomplete goal when creating', async ({ page, baseURL }) => {
      const { categories } = await setupApp(page, baseURL);
      const initialCount = categories.categories.length;

      await page.goto('/categories/new');
      await page.locator('form input[name="name"]').fill('Health');
      await page.locator('form input[name="goalValue"]').fill('500.00');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/categories\/new$/);
      expect(categories.categories).toHaveLength(initialCount);
    });

    test('lists the current goal', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, {
        categories: [
          {
            id: '1',
            name: 'Food',
            color: '#ff0000',
            active: true,
            goalEndsOn: null,
            goals: [{ id: '10', month: 1, year: 2026, value: 400 }],
          },
          { id: '2', name: 'Transport', color: '#00ff00', active: true, goalEndsOn: null, goals: [] },
        ],
      });

      await page.goto('/categories');

      await expect(page.getByRole('columnheader', { name: 'Current goal' })).toBeVisible();
      await expect(page.getByRole('row', { name: 'Food' })).toContainText('$400.00');
      await expect(page.getByRole('row', { name: 'Transport' })).toContainText('—');
    });

    test('edits a category', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories');
      await page.getByRole('link', { name: 'Food' }).click();

      await expect(panelTitle(page)).toHaveText(/edit category/i);
      await expect(page.locator('form input[name="name"]')).toHaveValue('Food');
      await expect(page.getByRole('checkbox', { name: 'Active' })).toBeChecked();

      await page.locator('form input[name="name"]').fill('Groceries');
      await page.getByRole('checkbox', { name: 'Active' }).uncheck();
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/categories$/);
      await expect(page.getByText('Category was successfully updated.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Groceries' })).toBeVisible();
    });

    test('saves an end date after the last month that already has a goal', async ({ page, baseURL }) => {
      const { categories } = await setupApp(page, baseURL, {
        categories: [
          {
            id: '1',
            name: 'Food',
            color: '#ff0000',
            active: true,
            goalEndsOn: null,
            goals: [{ id: '10', month: 1, year: 2026, value: 400 }],
          },
        ],
      });

      await page.goto('/categories');
      await page.getByRole('link', { name: 'Food' }).click();
      await page.locator('form input[name="goalEndsOn"]').fill('02/2026');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/categories$/);
      expect(categories.find('1')?.goalEndsOn).toBe('2026-02-01');
    });

    test('rejects an end date on a month that already has a goal', async ({ page, baseURL }) => {
      const { categories } = await setupApp(page, baseURL, {
        categories: [
          {
            id: '1',
            name: 'Food',
            color: '#ff0000',
            active: true,
            goalEndsOn: null,
            goals: [{ id: '10', month: 1, year: 2026, value: 400 }],
          },
        ],
      });

      await page.goto('/categories');
      await page.getByRole('link', { name: 'Food' }).click();
      await page.locator('form input[name="goalEndsOn"]').fill('01/2026');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('must be after a month that already has a goal')).toBeVisible();
      await expect(page).toHaveURL(/\/categories\/1/);
      expect(categories.find('1')?.goalEndsOn).toBeNull();
    });

    test('starts a goal when editing a category without one', async ({ page, baseURL }) => {
      const { categories } = await setupApp(page, baseURL);

      await page.goto('/categories');
      await page.getByRole('link', { name: 'Food' }).click();
      await page.locator('form input[name="goalStartsOn"]').fill('07/2026');
      await page.locator('form input[name="goalValue"]').fill('400.00');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/categories$/);
      expect(categories.find('1')?.goals).toEqual([expect.objectContaining({ month: 7, year: 2026, value: 400 })]);
    });

    test('changes the goal value for a later month', async ({ page, baseURL }) => {
      const { categories } = await setupApp(page, baseURL, {
        categories: [
          {
            id: '1',
            name: 'Food',
            color: '#ff0000',
            active: true,
            goalEndsOn: null,
            goals: [{ id: '10', month: 1, year: 2026, value: 400 }],
          },
          { id: '2', name: 'Transport', color: '#00ff00', active: true, goalEndsOn: null, goals: [] },
        ],
      });

      await page.goto('/categories');
      await page.getByRole('link', { name: 'Food' }).click();

      await expect(page.locator('form input[name="goalValue"]')).toBeDisabled();
      await page.getByRole('button', { name: 'Change' }).click();

      const modal = page.locator('.modal.is-active');
      await expect(modal.getByText('Change goal')).toBeVisible();
      await modal.locator('input[name="value"]').fill('600.00');
      await modal.locator('input[name="startsOn"]').fill('07/2026');
      await modal.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Goal created or updated successfully')).toBeVisible();
      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      expect(categories.find('1')?.goals.map((goal) => [goal.year, goal.month, goal.value])).toEqual([
        [2026, 1, 400],
        [2026, 7, 600],
        [2026, 8, 400],
      ]);
    });

    test('validates that the new goal value must differ', async ({ page, baseURL }) => {
      const { categories } = await setupApp(page, baseURL, {
        categories: [
          {
            id: '1',
            name: 'Food',
            color: '#ff0000',
            active: true,
            goalEndsOn: null,
            goals: [{ id: '10', month: 1, year: 2026, value: 400 }],
          },
        ],
      });
      const initialCount = categories.find('1')?.goals.length ?? 0;

      await page.goto('/categories');
      await page.getByRole('link', { name: 'Food' }).click();
      await page.getByRole('button', { name: 'Change' }).click();

      const modal = page.locator('.modal.is-active');
      await modal.getByRole('button', { name: 'Save' }).click();

      await expect(modal.getByText('must be different from the previous goal value')).toBeVisible();
      expect(categories.find('1')?.goals).toHaveLength(initialCount);
    });

    test('shows goal change history', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, {
        categories: [
          {
            id: '1',
            name: 'Food',
            color: '#ff0000',
            active: true,
            goalEndsOn: null,
            goals: [
              { id: '10', month: 1, year: 2026, value: 400 },
              { id: '11', month: 7, year: 2026, value: 600 },
            ],
          },
        ],
      });

      await page.goto('/categories');
      await page.getByRole('link', { name: 'Food' }).click();

      await expect(page.getByRole('button', { name: 'Show change history' })).toBeVisible();
      await page.getByRole('button', { name: 'Show change history' }).click();

      const modal = page.locator('.modal.is-active');
      await expect(modal.getByText('Goal history')).toBeVisible();
      await expect(modal.getByText('01/2026')).toBeVisible();
      await expect(modal.getByText('07/2026')).toBeVisible();
      await expect(modal.getByText('$400.00')).toBeVisible();
      await expect(modal.getByText('$600.00')).toBeVisible();
    });

    test('deletes a category after confirmation', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories');
      await expect(page.getByRole('link', { name: 'Transport' })).toBeVisible();
      await page.getByRole('row', { name: 'Transport' }).locator('a.delete').click();

      await expect(page.locator('.modal.is-active')).toBeVisible();
      await expect(page.getByText(/remove the category "Transport"/i)).toBeVisible();
      await page.locator('.modal.is-active').getByRole('button', { name: 'Yes', exact: true }).click();

      await expect(page.getByText('Category was successfully deleted.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Transport' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Food' })).toBeVisible();
    });

    test('cancels deleting a category', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories');
      await expect(page.getByRole('link', { name: 'Transport' })).toBeVisible();
      await page.getByRole('row', { name: 'Transport' }).locator('a.delete').click();
      await page.locator('.modal.is-active').getByRole('button', { name: 'No', exact: true }).click();

      await expect(page.locator('.modal.is-active')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Transport' })).toBeVisible();
    });

    test('filters categories by name', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories');
      await expect(page.getByRole('link', { name: 'Food' })).toBeVisible();

      const filtered = page.waitForRequest((request) => {
        if (request.method() !== 'GET' || !request.url().includes('/api/v1/categories')) {
          return false;
        }

        return new URL(request.url()).searchParams.get('q[name_cont]') === 'Food';
      });

      await page.getByPlaceholder('Filter by name').fill('Food');
      await filtered;

      await expect(page).toHaveURL(/name=Food/);
      await expect(page.getByRole('link', { name: 'Food' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Transport' })).toHaveCount(0);
    });

    test('filters categories by active state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories');
      await expect(page.getByRole('link', { name: 'Food' })).toBeVisible();
      await page.getByRole('button', { name: 'Filter by active' }).click();
      await page.getByRole('option', { name: 'Inactive' }).click();

      await expect(page).toHaveURL(/active=false/);
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Food' })).toHaveCount(0);
    });

    test('sorts categories by name', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories');
      await expect(page.getByRole('link', { name: 'Food' })).toBeVisible();
      await page.locator('th.sortable', { hasText: 'Name' }).click();

      await expect(page).toHaveURL(/sort=name(\+| |%20)asc/);
      await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible();
    });

    test('paginates categories', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { categories: defaultCategories, perPage: 1 });

      await page.goto('/categories?per_page=1');

      await expect(page.getByRole('link', { name: 'Food' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Transport' })).toHaveCount(0);

      await page.locator('.pagination-list').getByText('Next ›').click();

      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByRole('link', { name: 'Transport' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Food' })).toHaveCount(0);
    });

    test('returns to the list from the new form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/categories/new');
      await page.getByRole('link', { name: 'Back' }).click();

      await expect(page).toHaveURL(/\/categories$/);
      await expect(panelTitle(page)).toHaveText(/categories/i);
    });
  });
});
