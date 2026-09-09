import type { Page } from '@playwright/test';
import { fulfillJson } from './http';

export const SESSION_TOKEN = 'e2e-access-token';

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  locale: 'en' | 'pt-BR';
};

export type SessionState = {
  authenticated: boolean;
  user: SessionUser;
};

export function defaultSessionUser(): SessionUser {
  return {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'user@example.com',
    locale: 'en',
  };
}

export function createSessionState(authenticated = true): SessionState {
  return {
    authenticated,
    user: defaultSessionUser(),
  };
}

export function userResource(user: SessionUser) {
  return {
    data: {
      id: user.id,
      type: 'user' as const,
      attributes: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        configs: { locale: user.locale },
      },
    },
  };
}

export async function setLocaleCookie(page: Page, baseURL: string | undefined) {
  await page.context().addCookies([
    {
      name: 'locale',
      value: 'en',
      url: baseURL ?? 'http://localhost:5173',
    },
  ]);
}

export type CableMock = {
  sendToChannel: (identifier: Record<string, string | number | boolean | null>, message: unknown) => void;
};

export async function mockCable(page: Page): Promise<CableMock> {
  let socket: { send: (message: string) => void } | null = null;

  await page.routeWebSocket(/\/cable/, (ws) => {
    socket = ws;
    ws.send(JSON.stringify({ type: 'welcome' }));

    ws.onMessage((message) => {
      const frame = JSON.parse(String(message)) as { command?: string; identifier?: string };

      if (frame.command === 'subscribe' && frame.identifier) {
        ws.send(JSON.stringify({ type: 'confirm_subscription', identifier: frame.identifier }));
      }
    });
  });

  return {
    sendToChannel(identifier, message) {
      socket?.send(JSON.stringify({ identifier: JSON.stringify(identifier), message }));
    },
  };
}

export async function mockSessionRefresh(page: Page, session: SessionState) {
  await page.route('**/api/v1/user/session/refreshes**', (route) => {
    if (route.request().method() !== 'PATCH') {
      return route.fallback();
    }

    if (!session.authenticated) {
      return fulfillJson(route, { status: 'error', message: 'Unauthorized', details: {} }, 401);
    }

    return fulfillJson(route, {
      status: 'success' as const,
      type: 'object' as const,
      data: {
        token: SESSION_TOKEN,
        user: userResource(session.user),
      },
    });
  });
}
