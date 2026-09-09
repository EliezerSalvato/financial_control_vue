import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

test.describe('not found', () => {
  test('shows the 404 page in the body with header and footer', async ({ page, baseURL }) => {
    await setupApp(page, baseURL);

    await page.goto('/this-route-does-not-exist');

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByText('The page you are looking for does not exist or may have been moved.')).toBeVisible();
    await expect(page.locator('nav.navbar.is-fixed-top')).toBeVisible();
    await expect(page.locator('nav.nav-footer')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Monthly Statement' })).toBeVisible();
  });

  test('lets guests see 404 without redirecting to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/this-route-does-not-exist');

    await expect(page).toHaveURL(/\/this-route-does-not-exist/);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.locator('nav.navbar.is-fixed-top')).toBeVisible();
    await expect(page.locator('nav.nav-footer')).toBeVisible();
  });

  test('respects the locale', async ({ page, baseURL }) => {
    await setupApp(page, baseURL);

    await page.goto('/this-route-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();

    const profileUpdated = page.waitForRequest((request) => {
      return request.method() === 'PATCH' && request.url().includes('/api/v1/user/profiles');
    });

    await page.getByRole('button', { name: 'English (United States)' }).click();
    await page.getByText('Português (Brasil)').click();
    await profileUpdated;

    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
    await expect(page.getByText('A página que você procura não existe ou pode ter sido movida.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir para o início' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });

  test('goes home from the 404 page', async ({ page, baseURL }) => {
    await setupApp(page, baseURL);

    await page.goto('/this-route-does-not-exist');
    await page.getByRole('link', { name: 'Go to home' }).click();

    await expect(page).toHaveURL(/[?&]month=/);
  });
});
