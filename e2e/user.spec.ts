import type { Page } from '@playwright/test';
import { DEFAULT_CURRENT_PASSWORD, TAKEN_EMAIL } from './support/profile';
import { setupApp } from './support/setup';
import { expect, test } from '@playwright/test';

const SESSION_EMAIL = 'user@example.com';

async function fillSignIn(page: Page, email = SESSION_EMAIL, password = DEFAULT_CURRENT_PASSWORD) {
  await page.locator('form input[name="email"]').fill(email);
  await page.locator('form input[name="password"]').fill(password);
}

async function fillRegistration(
  page: Page,
  fields: { email?: string; firstName?: string; lastName?: string; password?: string; passwordConfirmation?: string } = {},
) {
  await page.locator('form input[name="email"]').fill(fields.email ?? 'ada@example.com');
  await page.locator('form input[name="firstName"]').fill(fields.firstName ?? 'Ada');
  await page.locator('form input[name="lastName"]').fill(fields.lastName ?? 'Lovelace');
  await page.locator('form input[name="password"]').fill(fields.password ?? 'newpassword');
  await page.locator('form input[name="passwordConfirmation"]').fill(fields.passwordConfirmation ?? fields.password ?? 'newpassword');
}

test.describe('user', () => {
  test.describe('sign in', () => {
    test('shows the login form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-in');

      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Monthly Statement' })).toHaveCount(0);
    });

    test('validates blank credentials', async ({ page, baseURL }) => {
      const { session } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-in');
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page.getByText("can't be blank")).toHaveCount(2);
      await expect(page).toHaveURL(/\/users\/sign-in/);
      expect(session.authenticated).toBe(false);
    });

    test('shows API errors when credentials are invalid', async ({ page, baseURL }) => {
      const { session } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-in');
      await fillSignIn(page, SESSION_EMAIL, 'wrong-password');
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page.getByText('Invalid email or password.')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/sign-in/);
      expect(session.authenticated).toBe(false);
    });

    test('signs in and redirects to the monthly statement', async ({ page, baseURL }) => {
      const { session } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-in');
      await fillSignIn(page);
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page).toHaveURL(/[?&]month=/);
      await expect(page.getByRole('link', { name: 'Monthly Statement' })).toBeVisible();
      await expect(page.locator('a.navbar-item[href="/users/profile"]')).toHaveAttribute('title', 'Test User');
      expect(session.authenticated).toBe(true);
    });

    test('remembers the session when remember me is checked', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-in');
      await fillSignIn(page);
      await page.getByRole('checkbox', { name: 'Remember me' }).check();
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page.getByRole('link', { name: 'Monthly Statement' })).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem('rememberMe'))).toBe('true');
    });

    test('redirects to the original page after sign in', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-in?redirect=/tags');
      await fillSignIn(page);
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page).toHaveURL(/\/tags$/);
      await expect(page.getByRole('link', { name: 'Work' })).toBeVisible();
    });

    test('navigates to sign up from the login links', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-in');
      await page.getByRole('link', { name: 'Sign up' }).click();

      await expect(page).toHaveURL(/\/users\/sign-up$/);
      await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
    });
  });

  test.describe('sign up', () => {
    test('shows the registration form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-up');

      await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible();
    });

    test('validates blank fields', async ({ page, baseURL }) => {
      const { auth } = await setupApp(page, baseURL, { authenticated: false });
      const initialCount = auth.users.length;

      await page.goto('/users/sign-up');
      await page.getByRole('button', { name: 'Sign up' }).click();

      await expect(page.getByText("can't be blank")).toHaveCount(5);
      await expect(page).toHaveURL(/\/users\/sign-up$/);
      expect(auth.users).toHaveLength(initialCount);
    });

    test('validates an invalid email', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-up');
      await fillRegistration(page, { email: 'not-an-email' });
      await page.getByRole('button', { name: 'Sign up' }).click();

      await expect(page.getByText('is invalid')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/sign-up$/);
    });

    test('validates a short password', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-up');
      await fillRegistration(page, { password: 'short', passwordConfirmation: 'short' });
      await page.getByRole('button', { name: 'Sign up' }).click();

      await expect(page.getByText('is too short (minimum is 8 characters)')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/sign-up$/);
    });

    test('validates a password confirmation mismatch', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-up');
      await fillRegistration(page, { password: 'newpassword', passwordConfirmation: 'otherpassword' });
      await page.getByRole('button', { name: 'Sign up' }).click();

      await expect(page.getByText("doesn't match Password")).toBeVisible();
      await expect(page).toHaveURL(/\/users\/sign-up$/);
    });

    test('shows API errors when the email is already taken', async ({ page, baseURL }) => {
      const { auth } = await setupApp(page, baseURL, { authenticated: false });
      const initialCount = auth.users.length;

      await page.goto('/users/sign-up');
      await fillRegistration(page, { email: TAKEN_EMAIL });
      await page.getByRole('button', { name: 'Sign up' }).click();

      await expect(page.getByText('has already been taken')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/sign-up$/);
      expect(auth.users).toHaveLength(initialCount);
    });

    test('creates an account and asks the user to confirm email', async ({ page, baseURL }) => {
      const { auth, session } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-up');
      await fillRegistration(page);
      await page.getByRole('button', { name: 'Sign up' }).click();

      await expect(page).toHaveURL(/\/users\/sign-in/);
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
      await expect(
        page.getByText('A message with a confirmation link has been sent to your email address. Please follow the link to activate your account.'),
      ).toBeVisible();
      expect(session.authenticated).toBe(false);
      expect(auth.users).toHaveLength(2);
      expect(auth.users.at(-1)?.confirmed).toBe(false);
      expect(auth.pendingEmailConfirmation?.email).toBe('ada@example.com');
    });
  });

  test.describe('forgot password', () => {
    test('shows the forgot password form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/new');

      await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Send me reset password instructions' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    });

    test('validates a blank email', async ({ page, baseURL }) => {
      const { auth } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/new');
      await page.getByRole('button', { name: 'Send me reset password instructions' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/users\/password\/new$/);
      expect(auth.pendingPasswordReset).toBeNull();
    });

    test('validates an invalid email', async ({ page, baseURL }) => {
      const { auth } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/new');
      await page.locator('form input[name="email"]').fill('not-an-email');
      await page.getByRole('button', { name: 'Send me reset password instructions' }).click();

      await expect(page.getByText('is invalid')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/password\/new$/);
      expect(auth.pendingPasswordReset).toBeNull();
    });

    test('sends reset instructions for a known email', async ({ page, baseURL }) => {
      const { auth } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/new');
      await page.locator('form input[name="email"]').fill(SESSION_EMAIL);
      await page.getByRole('button', { name: 'Send me reset password instructions' }).click();

      await expect(page).toHaveURL(/\/users\/password\/new$/);
      await expect(page.getByText('You will receive an email with instructions on how to reset your password in a few minutes.')).toBeVisible();
      expect(auth.pendingPasswordReset?.email).toBe(SESSION_EMAIL);
    });

    test('does not reveal whether an unknown email exists', async ({ page, baseURL }) => {
      const { auth } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/new');
      await page.locator('form input[name="email"]').fill('unknown@example.com');
      await page.getByRole('button', { name: 'Send me reset password instructions' }).click();

      await expect(page.getByText('You will receive an email with instructions on how to reset your password in a few minutes.')).toBeVisible();
      expect(auth.pendingPasswordReset).toBeNull();
    });
  });

  test.describe('reset password', () => {
    test('shows the reset password form', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/edit?token=e2e-password-reset-1');

      await expect(page.getByRole('heading', { name: 'Change your password' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Change my password' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    });

    test('validates a missing token', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/edit');
      await page.locator('form input[name="password"]').fill('newpassword');
      await page.locator('form input[name="passwordConfirmation"]').fill('newpassword');
      await page.getByRole('button', { name: 'Change my password' }).click();

      await expect(page.getByText("can't be blank")).toBeVisible();
      await expect(page).toHaveURL(/\/users\/password\/edit$/);
    });

    test('validates a short password', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/edit?token=e2e-password-reset-1');
      await page.locator('form input[name="password"]').fill('short');
      await page.locator('form input[name="passwordConfirmation"]').fill('short');
      await page.getByRole('button', { name: 'Change my password' }).click();

      await expect(page.getByText('is too short (minimum is 8 characters)')).toBeVisible();
    });

    test('validates a password confirmation mismatch', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/edit?token=e2e-password-reset-1');
      await page.locator('form input[name="password"]').fill('newpassword');
      await page.locator('form input[name="passwordConfirmation"]').fill('otherpassword');
      await page.getByRole('button', { name: 'Change my password' }).click();

      await expect(page.getByText("doesn't match New password")).toBeVisible();
    });

    test('shows API errors when the token is invalid', async ({ page, baseURL }) => {
      await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/edit?token=bogus');
      await page.locator('form input[name="password"]').fill('newpassword');
      await page.locator('form input[name="passwordConfirmation"]').fill('newpassword');
      await page.getByRole('button', { name: 'Change my password' }).click();

      await expect(page.getByText('is invalid')).toBeVisible();
      await expect(page).toHaveURL(/\/users\/password\/edit/);
    });

    test('resets the password and redirects to sign in', async ({ page, baseURL }) => {
      const { auth } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/password/new');
      await page.locator('form input[name="email"]').fill(SESSION_EMAIL);
      await page.getByRole('button', { name: 'Send me reset password instructions' }).click();
      await expect(page.getByText('You will receive an email with instructions on how to reset your password in a few minutes.')).toBeVisible();

      const token = auth.pendingPasswordReset?.token;
      expect(token).toBeTruthy();

      await page.goto(`/users/password/edit?token=${token}`);
      await page.locator('form input[name="password"]').fill('newpassword');
      await page.locator('form input[name="passwordConfirmation"]').fill('newpassword');
      await page.getByRole('button', { name: 'Change my password' }).click();

      await expect(page).toHaveURL(/\/users\/sign-in/);
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
      await expect(page.getByText('Your password has been changed successfully. Please sign in with your new password.')).toBeVisible();
      expect(auth.users[0]?.password).toBe('newpassword');
      expect(auth.pendingPasswordReset).toBeNull();
    });
  });

  test.describe('confirm email', () => {
    test('blocks sign in until the registration is confirmed', async ({ page, baseURL }) => {
      const { auth, session } = await setupApp(page, baseURL, { authenticated: false });

      await page.goto('/users/sign-up');
      await fillRegistration(page);
      await page.getByRole('button', { name: 'Sign up' }).click();
      await expect(page).toHaveURL(/\/users\/sign-in/);

      await fillSignIn(page, 'ada@example.com', 'newpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page.getByText('You have to confirm your email address before continuing.')).toBeVisible();
      expect(session.authenticated).toBe(false);

      const token = auth.pendingEmailConfirmation?.token;
      expect(token).toBeTruthy();

      await page.goto(`/users/confirmation?token=${token}`);

      await expect(page).toHaveURL(/\/users\/sign-in/);
      await expect(page.getByText('Your email address has been successfully confirmed.')).toBeVisible();
      expect(auth.users.at(-1)?.confirmed).toBe(true);
      expect(auth.pendingEmailConfirmation).toBeNull();

      await fillSignIn(page, 'ada@example.com', 'newpassword');
      await page.getByRole('button', { name: 'Login' }).click();

      await expect(page.getByRole('link', { name: 'Monthly Statement' })).toBeVisible();
      await expect(page.locator('a.navbar-item[href="/users/profile"]')).toHaveAttribute('title', 'Ada Lovelace');
      expect(session.authenticated).toBe(true);
      expect(session.user.email).toBe('ada@example.com');
    });
  });

  test('redirects signed-in users away from guest-only pages', async ({ page, baseURL }) => {
    await setupApp(page, baseURL);

    for (const path of ['/users/sign-in', '/users/sign-up', '/users/password/new', '/users/password/edit']) {
      await page.goto(path);
      await expect(page).toHaveURL(/[?&]month=/);
      await expect(page.getByRole('link', { name: 'Monthly Statement' })).toBeVisible();
    }
  });

  test.describe('when signed in', () => {
    test('signs out', async ({ page, baseURL }) => {
      const { session } = await setupApp(page, baseURL);

      await page.goto('/tags');
      await page.locator('a.navbar-item[title="Logout"]').click();

      await expect(page).toHaveURL(/\/users\/sign-in/);
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Monthly Statement' })).toHaveCount(0);
      expect(session.authenticated).toBe(false);
    });

    test('switches the locale', async ({ page, baseURL }) => {
      const { session } = await setupApp(page, baseURL);

      await page.goto('/tags');
      await expect(page.getByRole('link', { name: 'Monthly Statement' })).toBeVisible();

      const profileUpdated = page.waitForRequest((request) => {
        return request.method() === 'PATCH' && request.url().includes('/api/v1/user/profiles');
      });

      await page.getByRole('button', { name: 'English (United States)' }).click();
      await page.getByText('Português (Brasil)').click();
      await profileUpdated;

      await expect(page.getByRole('link', { name: 'Extrato Mensal' })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
      expect(session.user.locale).toBe('pt-BR');
      expect(await page.evaluate(() => document.cookie)).toMatch(/locale=pt-BR/);
    });
  });
});
