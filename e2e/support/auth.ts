import type { SessionState, SessionUser } from './app';
import type { Page, Route } from '@playwright/test';
import { SESSION_TOKEN, userResource } from './app';
import { apiPath, fulfillJson } from './http';
import { DEFAULT_CURRENT_PASSWORD, TAKEN_EMAIL } from './profile';

type AuthenticationPayload = {
  email?: string;
  password?: string;
  remember_me?: boolean;
};

type RegistrationPayload = {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  password_confirmation?: string;
};

type PasswordResetPayload = {
  email?: string;
};

type PasswordResetUpdatePayload = {
  token?: string;
  password?: string;
  password_confirmation?: string;
};

type EmailConfirmationPayload = {
  token?: string;
};

export type GuestUserRecord = SessionUser & {
  password: string;
  confirmed: boolean;
};

export type PendingToken = {
  token: string;
  email: string;
};

export class GuestAuthApi {
  session: SessionState;
  users: GuestUserRecord[];
  takenEmails: Set<string>;
  pendingEmailConfirmation: PendingToken | null;
  pendingPasswordReset: PendingToken | null;
  nextUserId: number;
  nextTokenId: number;

  constructor(session: SessionState, password = DEFAULT_CURRENT_PASSWORD) {
    this.session = session;
    this.users = [
      {
        ...session.user,
        password,
        confirmed: true,
      },
    ];
    this.takenEmails = new Set([TAKEN_EMAIL]);
    this.pendingEmailConfirmation = null;
    this.pendingPasswordReset = null;
    this.nextUserId = 2;
    this.nextTokenId = 1;
  }

  async handle(route: Route) {
    const request = route.request();
    const method = request.method();
    const path = apiPath(request.url());

    if (path.endsWith('/authentications') && method === 'POST') {
      return this.createAuthentication(route);
    }

    if (path.endsWith('/registrations') && method === 'POST') {
      return this.createRegistration(route);
    }

    if (path.endsWith('/password/resets') && method === 'POST') {
      return this.createPasswordReset(route);
    }

    if (path.endsWith('/password/resets') && method === 'PATCH') {
      return this.updatePasswordReset(route);
    }

    if (path.endsWith('/email/confirmations') && method === 'POST') {
      return this.confirmRegistration(route);
    }

    if (path.endsWith('/session/revokes') && method === 'DELETE') {
      return this.revokeSessions(route);
    }

    return fulfillJson(route, { status: 'error', message: 'Not found', details: {} }, 404);
  }

  private async createAuthentication(route: Route) {
    const payload = (await route.request().postDataJSON()) as AuthenticationPayload;
    const email = payload.email?.trim() ?? '';
    const password = payload.password ?? '';
    const user = this.findUserByEmail(email);

    if (!user || user.password !== password) {
      return fulfillJson(route, { status: 'error', message: 'Invalid email or password.', details: {} }, 401);
    }

    if (!user.confirmed) {
      return fulfillJson(route, { status: 'error', message: 'You have to confirm your email address before continuing.', details: {} }, 401);
    }

    this.applySessionUser(user);

    return fulfillJson(route, {
      status: 'success',
      type: 'object',
      data: {
        token: SESSION_TOKEN,
        user: userResource(this.session.user),
      },
    });
  }

  private async createRegistration(route: Route) {
    const payload = (await route.request().postDataJSON()) as RegistrationPayload;
    const email = payload.email?.trim() ?? '';
    const details: Record<string, string[]> = {};

    if (this.isTakenEmail(email)) {
      details.email = ['has already been taken'];
    }

    if (Object.keys(details).length) {
      return fulfillJson(route, { status: 'error', message: 'Validation failed', details }, 422);
    }

    const user: GuestUserRecord = {
      id: `user-${this.nextUserId++}`,
      firstName: payload.first_name?.trim() ?? '',
      lastName: payload.last_name?.trim() ?? '',
      email,
      locale: 'en',
      password: payload.password ?? '',
      confirmed: false,
    };

    this.users.push(user);
    this.pendingEmailConfirmation = {
      token: `e2e-registration-confirmation-${this.nextTokenId++}`,
      email,
    };

    return fulfillJson(route, {
      status: 'success',
      message: 'A message with a confirmation link has been sent to your email address. Please follow the link to activate your account.',
      type: 'object',
      data: {
        user: userResource(user),
      },
    });
  }

  private async createPasswordReset(route: Route) {
    const payload = (await route.request().postDataJSON()) as PasswordResetPayload;
    const email = payload.email?.trim() ?? '';
    const user = this.findUserByEmail(email);

    if (user) {
      this.pendingPasswordReset = {
        token: `e2e-password-reset-${this.nextTokenId++}`,
        email: user.email,
      };
    }

    return fulfillJson(route, {
      status: 'success',
      message: 'You will receive an email with instructions on how to reset your password in a few minutes.',
    });
  }

  private async updatePasswordReset(route: Route) {
    const payload = (await route.request().postDataJSON()) as PasswordResetUpdatePayload;
    const token = payload.token?.trim() ?? '';
    const password = payload.password ?? '';
    const passwordConfirmation = payload.password_confirmation ?? '';
    const details: Record<string, string[]> = {};

    if (!token || token !== this.pendingPasswordReset?.token) {
      details.token = ['is invalid'];
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

    const user = this.findUserByEmail(this.pendingPasswordReset?.email ?? '');

    if (user) {
      user.password = password;
    }

    this.pendingPasswordReset = null;

    return fulfillJson(route, {
      status: 'success',
      message: 'Your password has been changed successfully. Please sign in with your new password.',
    });
  }

  private async confirmRegistration(route: Route) {
    const payload = (await route.request().postDataJSON()) as EmailConfirmationPayload;
    const token = payload.token?.trim() ?? '';

    if (!token || token !== this.pendingEmailConfirmation?.token) {
      return route.fallback();
    }

    const user = this.findUserByEmail(this.pendingEmailConfirmation.email);

    if (user) {
      user.confirmed = true;
    }

    this.pendingEmailConfirmation = null;

    return fulfillJson(route, {
      status: 'success',
      message: 'Your email address has been successfully confirmed.',
    });
  }

  private revokeSessions(route: Route) {
    this.session.authenticated = false;

    return fulfillJson(route, {
      status: 'success',
      message: 'Signed out successfully.',
    });
  }

  private applySessionUser(user: GuestUserRecord) {
    this.session.authenticated = true;
    this.session.user = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      locale: user.locale,
    };
  }

  private findUserByEmail(email: string) {
    const normalized = email.toLowerCase();

    return this.users.find((user) => user.email.toLowerCase() === normalized);
  }

  private isTakenEmail(email: string) {
    const normalized = email.toLowerCase();

    return this.takenEmails.has(normalized) || this.users.some((user) => user.email.toLowerCase() === normalized);
  }
}

export async function mockGuestAuthApi(page: Page, auth: GuestAuthApi) {
  await page.route(/\/api\/v1\/user\/(authentications|registrations|password\/resets|email\/confirmations|session\/revokes)(\?|$)/, (route) =>
    auth.handle(route),
  );

  return auth;
}
