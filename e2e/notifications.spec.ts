import type { Page } from '@playwright/test';
import { defaultNotifications, manyNotifications, notificationResource } from './support/notifications';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelTitle(page: Page) {
  return page.locator('nav.panel .panel-heading-title');
}

function notificationsMenu(page: Page) {
  return page.getByRole('button', { name: 'Notifications' }).filter({ visible: true });
}

function notificationsPanel(page: Page) {
  return page.getByRole('dialog', { name: 'Notifications' });
}

async function openNotificationsMenu(page: Page) {
  await notificationsMenu(page).click();
  await expect(notificationsPanel(page)).toBeVisible();
}

test.describe('notifications', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/notifications');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('lists notifications', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/notifications');

      await expect(panelTitle(page)).toHaveText(/notifications/i);
      await expect(page.getByText('2 unread')).toBeVisible();
      await expect(page.getByRole('link', { name: /Invoice due/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /Transaction updated/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /Welcome/ })).toBeVisible();
      await expect(page.locator('a.inbox-item', { hasText: 'Invoice due' })).toHaveClass(/is-unread/);
      await expect(page.locator('a.inbox-item', { hasText: 'Welcome' })).not.toHaveClass(/is-unread/);
    });

    test('shows an empty state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: [] });

      await page.goto('/notifications');

      await expect(page.getByText('No notifications yet.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
    });

    test('filters unread notifications', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/notifications');
      await expect(page.getByRole('link', { name: /Welcome/ })).toBeVisible();

      const filtered = page.waitForRequest((request) => {
        if (request.method() !== 'GET' || !request.url().includes('/api/v1/notifications')) {
          return false;
        }

        return new URL(request.url()).searchParams.get('unread') === 'true';
      });

      await page.getByRole('button', { name: 'Unread only' }).click();
      await filtered;

      await expect(page.getByRole('link', { name: /Invoice due/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /Transaction updated/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /Welcome/ })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Show all' })).toBeVisible();

      await page.getByRole('button', { name: 'Show all' }).click();

      await expect(page.getByRole('link', { name: /Welcome/ })).toBeVisible();
    });

    test('shows an empty unread state', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, {
        notifications: defaultNotifications.map((notification) => ({
          ...notification,
          read: true,
          readAt: notification.readAt ?? '2026-09-07T09:00:00.000Z',
        })),
      });

      await page.goto('/notifications');
      await page.getByRole('button', { name: 'Unread only' }).click();

      await expect(page.getByText('No unread notifications.')).toBeVisible();
    });

    test('opens a notification and marks it as read', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/notifications');
      await page.getByRole('link', { name: /Invoice due/ }).click();

      await expect(page).toHaveURL(/\/notifications\/1$/);
      await expect(page.locator('nav.panel .panel-heading')).toHaveText('Notification');
      await expect(page.getByRole('heading', { name: 'Invoice due' })).toBeVisible();
      await expect(page.getByText('Your invoice is ready.')).toBeVisible();
      await expect(page.getByText('Read', { exact: true })).toBeVisible();

      await page.getByRole('link', { name: 'Back' }).click();

      await expect(page).toHaveURL(/\/notifications$/);
      await expect(page.getByText('1 unread')).toBeVisible();
      await expect(page.locator('a.inbox-item', { hasText: 'Invoice due' })).not.toHaveClass(/is-unread/);
    });

    test('links a related transaction', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/notifications/2');

      await expect(page.getByRole('heading', { name: 'Transaction updated' })).toBeVisible();
      await expect(page.getByText('Related record')).toBeVisible();
      await expect(page.getByText('Transaction::Record')).toBeVisible();
      await expect(page.getByText('"amount": 50')).toBeVisible();
      await page.getByRole('link', { name: 'Edit transaction' }).click();

      await expect(page).toHaveURL(/\/transactions\/edit\/1$/);
    });

    test('marks all notifications as read', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/notifications');
      await expect(page.getByText('2 unread')).toBeVisible();
      await page.getByRole('button', { name: 'Mark all as read' }).click();

      await expect(page.getByText('2 unread')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
      await expect(page.locator('a.inbox-item.is-unread')).toHaveCount(0);
    });

    test('loads more notifications when scrolling', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: manyNotifications(12) });

      const loadedMore = page.waitForRequest((request) => {
        if (request.method() !== 'GET' || !request.url().includes('/api/v1/notifications')) {
          return false;
        }

        return new URL(request.url()).searchParams.has('after');
      });

      await page.goto('/notifications');
      await expect(page.getByRole('link', { name: /Notice 12/ })).toBeVisible();

      await page.evaluate(() => {
        const el = document.scrollingElement ?? document.documentElement;
        el.scrollTo(0, el.scrollHeight);
      });
      await loadedMore;

      await expect(page.getByRole('link', { name: /Notice 01/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /Notice 12/ })).toBeVisible();
    });

    test('shows an error when the notification is missing', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/notifications/missing');

      await expect(page.getByText('Not found')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
    });

    test('returns to the list from the details page', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/notifications/3');
      await page.getByRole('link', { name: 'Back' }).click();

      await expect(page).toHaveURL(/\/notifications$/);
      await expect(panelTitle(page)).toHaveText(/notifications/i);
    });

    test('prepends a live notification', async ({ page, baseURL }) => {
      const { cable } = await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/notifications');
      await expect(page.getByRole('link', { name: /Invoice due/ })).toBeVisible();

      await expect(async () => {
        cable.sendToChannel(
          { channel: 'NotificationChannel' },
          {
            user_id: 'user-1',
            kind: 'created',
            unread_count: 3,
            notification: notificationResource({
              id: '99',
              kind: 'alert',
              title: 'Budget alert',
              body: 'Spending is high.',
              read: false,
              readAt: null,
              notifiableType: null,
              notifiableId: null,
              data: {},
              createdAt: '2026-09-08T13:00:00.000Z',
            }),
          },
        );

        await expect(page.getByRole('link', { name: /Budget alert/ })).toBeVisible();
      }).toPass();

      await expect(page.getByText('3 unread')).toBeVisible();
    });

    test('shows an unread badge in the navbar', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/tags');

      await expect(notificationsMenu(page).locator('.notifications-badge')).toHaveText('2');
    });

    test('opens the navbar panel and lists notifications', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/tags');
      await openNotificationsMenu(page);

      await expect(notificationsPanel(page).getByText('2 unread')).toBeVisible();
      await expect(notificationsPanel(page).getByRole('link', { name: /Invoice due/ })).toBeVisible();
      await expect(notificationsPanel(page).getByRole('link', { name: /Welcome/ })).toBeVisible();
    });

    test('filters unread notifications in the navbar panel', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/tags');
      await openNotificationsMenu(page);
      await notificationsPanel(page).getByRole('button', { name: 'Unread only' }).click();

      await expect(notificationsPanel(page).getByRole('link', { name: /Invoice due/ })).toBeVisible();
      await expect(notificationsPanel(page).getByRole('link', { name: /Welcome/ })).toHaveCount(0);

      await notificationsPanel(page).getByRole('button', { name: 'Show all' }).click();

      await expect(notificationsPanel(page).getByRole('link', { name: /Welcome/ })).toBeVisible();
    });

    test('marks all as read from the navbar panel', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/tags');
      await openNotificationsMenu(page);
      await notificationsPanel(page).getByRole('button', { name: 'Mark all as read' }).click();

      await expect(notificationsPanel(page).getByText('2 unread')).toHaveCount(0);
      await expect(notificationsPanel(page).getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
      await expect(notificationsMenu(page).locator('.notifications-badge')).toHaveCount(0);
    });

    test('goes to the full list from the navbar panel', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/tags');
      await openNotificationsMenu(page);
      await notificationsPanel(page).getByRole('button', { name: 'View all' }).click();

      await expect(page).toHaveURL(/\/notifications$/);
      await expect(panelTitle(page)).toHaveText(/notifications/i);
    });

    test('opens a notification from the navbar panel', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { notifications: defaultNotifications });

      await page.goto('/tags');
      await openNotificationsMenu(page);
      await notificationsPanel(page)
        .getByRole('link', { name: /Invoice due/ })
        .click();

      await expect(page).toHaveURL(/\/notifications\/1$/);
      await expect(notificationsPanel(page)).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Invoice due' })).toBeVisible();
    });
  });
});
