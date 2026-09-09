import type { Page } from '@playwright/test';
import { DEFAULT_CURRENT_PASSWORD, TAKEN_EMAIL } from './support/profile';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

function panelByTitle(page: Page, title: string) {
  return page.locator('.profile nav.panel').filter({ has: page.locator('.panel-heading', { hasText: title }) });
}

function namePanel(page: Page) {
  return panelByTitle(page, 'Profile');
}

function emailPanel(page: Page) {
  return panelByTitle(page, 'Change Email');
}

function passwordPanel(page: Page) {
  return panelByTitle(page, 'Change Password');
}

test.describe('profile', () => {
  test('redirects guests to sign in', async ({ page, baseURL }) => {
    await setupApp(page, baseURL, { authenticated: false });

    await page.goto('/users/profile');

    await expect(page).toHaveURL(/\/users\/sign-in/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test.describe('when signed in', () => {
    test('shows the current profile', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/users/profile');

      await expect(namePanel(page).locator('.panel-heading')).toHaveText('Profile');
      await expect(namePanel(page).locator('input[name="firstName"]')).toHaveValue('Test');
      await expect(namePanel(page).locator('input[name="lastName"]')).toHaveValue('User');
      await expect(emailPanel(page).locator('input[name="email"]')).toHaveValue('user@example.com');
      await expect(page.locator('a.navbar-item[href="/users/profile"]')).toHaveAttribute('title', 'Test User');
    });

    test('updates the name', async ({ page, baseURL }) => {
      const { session } = await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await namePanel(page).locator('input[name="firstName"]').fill('Ada');
      await namePanel(page).locator('input[name="lastName"]').fill('Lovelace');
      await namePanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Profile was successfully updated.')).toBeVisible();
      await expect(namePanel(page).locator('input[name="firstName"]')).toHaveValue('Ada');
      await expect(namePanel(page).locator('input[name="lastName"]')).toHaveValue('Lovelace');
      await expect(page.locator('a.navbar-item[href="/users/profile"]')).toHaveAttribute('title', 'Ada Lovelace');
      expect(session.user.firstName).toBe('Ada');
      expect(session.user.lastName).toBe('Lovelace');
    });

    test('validates a blank name', async ({ page, baseURL }) => {
      const { session } = await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await namePanel(page).locator('input[name="firstName"]').fill('');
      await namePanel(page).locator('input[name="lastName"]').fill('');
      await namePanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(namePanel(page).getByText("can't be blank")).toHaveCount(2);
      await expect(page).toHaveURL(/\/users\/profile$/);
      expect(session.user.firstName).toBe('Test');
      expect(session.user.lastName).toBe('User');
    });

    test('validates a blank email change', async ({ page, baseURL }) => {
      const { profile } = await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await emailPanel(page).locator('input[name="email"]').fill('');
      await emailPanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(emailPanel(page).getByText("can't be blank")).toHaveCount(2);
      await expect(page).toHaveURL(/\/users\/profile$/);
      expect(profile.pendingEmailChange).toBeNull();
    });

    test('shows API errors when the current password is wrong for email change', async ({ page, baseURL }) => {
      const { profile, session } = await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await emailPanel(page).locator('input[name="currentPassword"]').fill('wrong-password');
      await emailPanel(page).locator('input[name="email"]').fill('ada@example.com');
      await emailPanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(emailPanel(page).getByText('is invalid')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/profile$/);
      expect(profile.pendingEmailChange).toBeNull();
      expect(session.authenticated).toBe(true);
    });

    test('shows API errors when the new email is already taken', async ({ page, baseURL }) => {
      const { profile } = await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await emailPanel(page).locator('input[name="currentPassword"]').fill(DEFAULT_CURRENT_PASSWORD);
      await emailPanel(page).locator('input[name="email"]').fill(TAKEN_EMAIL);
      await emailPanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(emailPanel(page).getByText('has already been taken')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/profile$/);
      expect(profile.pendingEmailChange).toBeNull();
    });

    test('requests an email change and confirms it from the emailed link', async ({ page, baseURL }) => {
      const { profile, session } = await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await emailPanel(page).locator('input[name="currentPassword"]').fill(DEFAULT_CURRENT_PASSWORD);
      await emailPanel(page).locator('input[name="email"]').fill('ada@example.com');
      await emailPanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/users\/sign-in/);
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
      await expect(page.getByText('A confirmation email was sent to your new email address.')).toBeVisible();
      expect(session.authenticated).toBe(false);
      expect(session.user.email).toBe('user@example.com');
      expect(profile.pendingEmailChange?.email).toBe('ada@example.com');

      const token = profile.pendingEmailChange?.token;
      expect(token).toBeTruthy();

      await page.goto(`/users/confirmation?token=${token}`);

      await expect(page).toHaveURL(/\/users\/sign-in/);
      await expect(page.getByText('Your email address has been successfully confirmed.')).toBeVisible();
      expect(session.user.email).toBe('ada@example.com');
      expect(profile.pendingEmailChange).toBeNull();
    });

    test('validates a blank password change', async ({ page, baseURL }) => {
      const { session } = await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await passwordPanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(passwordPanel(page).getByText("can't be blank")).toHaveCount(3);
      await expect(page).toHaveURL(/\/users\/profile$/);
      expect(session.authenticated).toBe(true);
    });

    test('validates a short new password', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await passwordPanel(page).locator('input[name="currentPassword"]').fill(DEFAULT_CURRENT_PASSWORD);
      await passwordPanel(page).locator('input[name="password"]').fill('short');
      await passwordPanel(page).locator('input[name="passwordConfirmation"]').fill('short');
      await passwordPanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(passwordPanel(page).getByText('is too short (minimum is 8 characters)')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/profile$/);
    });

    test('validates a password confirmation mismatch', async ({ page, baseURL }) => {
      await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await passwordPanel(page).locator('input[name="currentPassword"]').fill(DEFAULT_CURRENT_PASSWORD);
      await passwordPanel(page).locator('input[name="password"]').fill('newpassword');
      await passwordPanel(page).locator('input[name="passwordConfirmation"]').fill('otherpassword');
      await passwordPanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(passwordPanel(page).getByText("doesn't match New password")).toBeVisible();
      await expect(page).toHaveURL(/\/users\/profile$/);
    });

    test('shows API errors when the current password is wrong for password change', async ({ page, baseURL }) => {
      const { session } = await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await passwordPanel(page).locator('input[name="currentPassword"]').fill('wrong-password');
      await passwordPanel(page).locator('input[name="password"]').fill('newpassword');
      await passwordPanel(page).locator('input[name="passwordConfirmation"]').fill('newpassword');
      await passwordPanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(passwordPanel(page).getByText('is invalid')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/profile$/);
      expect(session.authenticated).toBe(true);
    });

    test('updates the password and signs the user out', async ({ page, baseURL }) => {
      const { profile, session } = await setupApp(page, baseURL);

      await page.goto('/users/profile');
      await passwordPanel(page).locator('input[name="currentPassword"]').fill(DEFAULT_CURRENT_PASSWORD);
      await passwordPanel(page).locator('input[name="password"]').fill('newpassword');
      await passwordPanel(page).locator('input[name="passwordConfirmation"]').fill('newpassword');
      await passwordPanel(page).getByRole('button', { name: 'Save' }).click();

      await expect(page).toHaveURL(/\/users\/sign-in/);
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
      await expect(page.getByText('Password was successfully updated.')).toBeVisible();
      expect(session.authenticated).toBe(false);
      expect(profile.currentPassword).toBe('newpassword');
    });
  });

  test.describe('email confirmation', () => {
    test('shows an error when the token is missing', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/confirmation');

      await expect(page.getByRole('heading', { name: 'Confirm email' })).toBeVisible();
      await expect(page.getByText('Confirmation token is missing.')).toBeVisible();
    });

    test('shows an error when the token is invalid', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/confirmation?token=bogus');

      await expect(page.getByRole('heading', { name: 'Confirm email' })).toBeVisible();
      await expect(page.getByText('is invalid')).toBeVisible();
    });
  });
});
