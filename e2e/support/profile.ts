import type { SessionState } from './app';
import type { Page, Route } from '@playwright/test';
import { createSessionState } from './app';
import { apiPath, fulfillJson } from './http';

export const DEFAULT_CURRENT_PASSWORD = 'password';
export const TAKEN_EMAIL = 'taken@example.com';

type ProfileUpdatePayload = {
  first_name?: string;
  last_name?: string;
  configs?: { locale?: string };
};

type EmailChangePayload = {
  new_email?: string;
  current_password?: string;
};

type EmailConfirmationPayload = {
  token?: string;
};

type PasswordChangePayload = {
  current_password?: string;
  password?: string;
  password_confirmation?: string;
};

export type PendingEmailChange = {
  token: string;
  email: string;
};

export class ProfileApi {
  session: SessionState;
  currentPassword: string;
  pendingEmailChange: PendingEmailChange | null;
  takenEmails: Set<string>;
  nextConfirmationId: number;

  constructor(session: SessionState, currentPassword = DEFAULT_CURRENT_PASSWORD) {
    this.session = session;
    this.currentPassword = currentPassword;
    this.pendingEmailChange = null;
    this.takenEmails = new Set([TAKEN_EMAIL]);
    this.nextConfirmationId = 1;
  }

  async handle(route: Route) {
    const request = route.request();
    const method = request.method();
    const path = apiPath(request.url());

    if (path.endsWith('/email/confirmations') && method === 'POST') {
      return this.confirmEmail(route);
    }

    if (!this.session.authenticated) {
      return fulfillJson(route, { status: 'error', message: 'Unauthorized', details: {} }, 401);
    }

    if (path.endsWith('/profiles') && method === 'PATCH') {
      return this.updateProfile(route);
    }

    if (path.endsWith('/email/changes') && method === 'PATCH') {
      return this.changeEmail(route);
    }

    if (path.endsWith('/password/changes') && method === 'PATCH') {
      return this.changePassword(route);
    }

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }

  private async updateProfile(route: Route) {
    const payload = (await route.request().postDataJSON()) as ProfileUpdatePayload;
    const details: Record<string, string[]> = {};

    if (payload.first_name !== undefined && !payload.first_name.trim()) {
      details.first_name = ["can't be blank"];
    }

    if (payload.last_name !== undefined && !payload.last_name.trim()) {
      details.last_name = ["can't be blank"];
    }

    if (Object.keys(details).length) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details }, 422);
    }

    if (payload.first_name !== undefined) {
      this.session.user.firstName = payload.first_name.trim();
    }

    if (payload.last_name !== undefined) {
      this.session.user.lastName = payload.last_name.trim();
    }

    if (payload.configs?.locale === 'en' || payload.configs?.locale === 'pt-BR') {
      this.session.user.locale = payload.configs.locale;
    }

    return fulfillJson(route, {
      status: 'success',
      message: 'Profile was successfully updated.',
    });
  }

  private async changeEmail(route: Route) {
    const payload = (await route.request().postDataJSON()) as EmailChangePayload;
    const currentPassword = payload.current_password ?? '';
    const newEmail = payload.new_email?.trim() ?? '';
    const details: Record<string, string[]> = {};

    if (!currentPassword) {
      details.current_password = ["can't be blank"];
    } else if (currentPassword !== this.currentPassword) {
      details.current_password = ['is invalid'];
    }

    if (!newEmail) {
      details.new_email = ["can't be blank"];
    } else if (this.isTakenEmail(newEmail)) {
      details.new_email = ['has already been taken'];
    }

    if (Object.keys(details).length) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details }, 422);
    }

    this.pendingEmailChange = {
      token: `e2e-email-confirmation-${this.nextConfirmationId++}`,
      email: newEmail,
    };

    return fulfillJson(route, {
      status: 'success',
      message: 'A confirmation email was sent to your new email address.',
    });
  }

  private async confirmEmail(route: Route) {
    const payload = (await route.request().postDataJSON()) as EmailConfirmationPayload;
    const token = payload.token?.trim() ?? '';

    if (!token || token !== this.pendingEmailChange?.token) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details: { token: ['is invalid'] } }, 422);
    }

    this.session.user.email = this.pendingEmailChange.email;
    this.pendingEmailChange = null;

    return fulfillJson(route, {
      status: 'success',
      message: 'Your email address has been successfully confirmed.',
    });
  }

  private async changePassword(route: Route) {
    const payload = (await route.request().postDataJSON()) as PasswordChangePayload;
    const currentPassword = payload.current_password ?? '';
    const password = payload.password ?? '';
    const passwordConfirmation = payload.password_confirmation ?? '';
    const details: Record<string, string[]> = {};

    if (!currentPassword) {
      details.current_password = ["can't be blank"];
    } else if (currentPassword !== this.currentPassword) {
      details.current_password = ['is invalid'];
    }

    if (!password) {
      details.password = ["can't be blank"];
    }

    if (!passwordConfirmation) {
      details.password_confirmation = ["can't be blank"];
    } else if (password && password !== passwordConfirmation) {
      details.password_confirmation = ["doesn't match Password"];
    }

    if (Object.keys(details).length) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details }, 422);
    }

    this.currentPassword = password;

    return fulfillJson(route, {
      status: 'success',
      message: 'Password was successfully updated.',
    });
  }

  private isTakenEmail(email: string) {
    const normalized = email.toLowerCase();

    return normalized === this.session.user.email.toLowerCase() || this.takenEmails.has(normalized);
  }
}

export async function mockProfileApi(page: Page, profile = new ProfileApi(createSessionState())) {
  await page.route(/\/api\/v1\/user\/(profiles|email\/changes|email\/confirmations|password\/changes)(\?|$)/, (route) => profile.handle(route));

  return profile;
}
