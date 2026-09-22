# Financial Control Vue

Vue SPA for personal financial control: monthly statements, transactions, accounts, credit cards, and notifications.
Companion frontend for the [Financial Control Ruby API](https://github.com/EliezerSalvato/financial_control_ruby_api).

**Live:** [https://vue.financialcontrol.app.br/](https://vue.financialcontrol.app.br/)

## Tech stack

<table>
  <tr>
    <td align="left">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" alt="Vue" width="48" height="48" /><br />
      <strong>Vue</strong><br />
      3.5
    </td>
    <td align="left">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" alt="TypeScript" width="48" height="48" /><br />
      <strong>TypeScript</strong><br />
      6
    </td>
    <td align="left">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" alt="Vite" width="48" height="48" /><br />
      <strong>Vite</strong><br />
      8
    </td>
  </tr>
</table>

| Layer            | Technology                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Runtime          | Node.js 22.18+ or 24.12+ · pnpm                                                               |
| State            | Pinia (setup stores)                                                                          |
| Routing          | Vue Router 5                                                                                  |
| i18n             | vue-i18n (`legacy: false`) — `en` and `pt-BR`                                                 |
| HTTP             | native `fetch` via `apiRequest` in `@/api/client` (not axios)                                 |
| Realtime         | Action Cable WebSocket client (`@/api/cable`)                                                 |
| UI               | Bulma 0.7 · Font Awesome 7 · shared shells (`FormPanel`, `IndexPanel`, `components/inputs/*`) |
| Bank logos       | `@edusites/bancos-brasil`                                                                     |
| Testing          | Vitest (jsdom) · Playwright (Chromium, Firefox, WebKit)                                       |
| Linting & format | Oxlint, ESLint, Prettier, `vue-tsc`                                                           |
| Hosting          | Vercel (SPA rewrites + security headers)                                                      |

## Requirements

- [Node.js](https://nodejs.org/) `^22.18.0` or `>=24.12.0`
- [pnpm](https://pnpm.io/installation)
- The Rails API running locally (default `http://localhost:3000`) for authenticated flows and e2e

## Setup instructions

```bash
git clone <repository-url>
cd financial_control_vue

make setup
make dev
```

`make setup` installs dependencies and copies `.env.sample` to `.env` when `.env` is missing.

Point `VITE_API_BASE_URL` and `VITE_CABLE_URL` at the API. CORS on the API must allow this origin (`http://localhost:5173` by default).

## Environment variables

Copy `.env.sample` to `.env` and adjust values as needed. Vite only exposes variables prefixed with `VITE_`; they are baked in at build time.

| Variable            | Description                                                                   | Default                     |
| ------------------- | ----------------------------------------------------------------------------- | --------------------------- |
| `VITE_API_BASE_URL` | Rails JSON API origin (no trailing slash). Requests go to `{base}/api/v1/...` | `http://localhost:3000`     |
| `VITE_CABLE_URL`    | Action Cable WebSocket URL                                                    | `ws://localhost:3000/cable` |

Never commit `.env` or real secrets. Keep `.env.sample` updated when adding new variables.

The Vite dev server also proxies `/api` and `/cable` to those origins (including WebSocket). The app itself calls the env URLs directly, so the API must allow this frontend origin in `CORS_ORIGINS`.

## Running locally

```bash
make setup
make dev
```

| Resource             | URL                                                      |
| -------------------- | -------------------------------------------------------- |
| App                  | [http://localhost:5173](http://localhost:5173)           |
| API (companion)      | [http://localhost:3000](http://localhost:3000)           |
| API docs             | [http://localhost:3000/docs](http://localhost:3000/docs) |
| Mailpit (API emails) | [http://localhost:8025](http://localhost:8025)           |

Other Makefile targets:

```bash
make build          # type-check + production build
make preview        # serve dist/ (port 4173)
make lint           # oxlint + eslint --fix
make format         # Prettier on src/
make type-check     # vue-tsc
```

Equivalent pnpm scripts: `pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm lint`, `pnpm format`, `pnpm type-check`.

## Running tests

```bash
# Unit (Vitest, jsdom)
make test
make test-watch

# E2E (Playwright — Chromium, Firefox, WebKit)
make playwright-install
make test-e2e
```

Equivalent: `pnpm test:unit --run`, `pnpm test:unit`, `pnpm exec playwright install`, `pnpm test:e2e`.

CI (`.github/workflows/ci.yml`) runs three parallel jobs on push and pull requests: lint (oxlint + ESLint), unit tests, and Playwright e2e (Chromium, Firefox, WebKit). E2E intercepts HTTP and WebSocket in the browser. The HTML report is uploaded as a workflow artifact.

Playwright starts `pnpm dev` on port 5173 locally, or `pnpm build-only && pnpm preview` on 4173 when `CI` is set. E2E specs mock HTTP against `VITE_API_BASE_URL`; they do not require a live API.

```bash
pnpm test:e2e --project=chromium
pnpm test:e2e e2e/tags.spec.ts
pnpm test:e2e --debug
```

## Architecture

Feature flow (canonical example: **tags**):

```
types/ → transformers/ → api/ → pages/ → router/ (+ locales/)
```

Hard rules:

- Pages and components never build HTTP requests or map raw API payloads.
- Domain types are camelCase; API wire shapes use `*Api` when they differ.
- Prefer absolute imports (`@/...`).

```
src/
  api/  components/  composables/  locales/  pages/  router/  stores/  transformers/  types/  utils/
```

| Kind        | Pattern                                                                       |
| ----------- | ----------------------------------------------------------------------------- |
| Components  | `Paginator.vue`, `FormPanel.vue`, `IndexPanel.vue`                            |
| Composables | `useAuth.ts`-style files in `src/composables/`                                |
| Stores      | `stores/<id>/index.ts` — `auth`, `user`, `notification`, `inboxNotifications` |
| Types       | `Tag`, `TagCreatePayload`, `TagAttributesApi`                                 |
| API         | plural domain folders + verbs (`listTags`, `createTag`)                       |
| Routes      | `camelCase` names; path segments in `kebab-case`                              |

HTTP: `apiRequest` sends JSON, Bearer token, `credentials: 'include'` (refresh cookie), and a `locale` cookie. On **401** it retries once after `PATCH /api/v1/user/session/refreshes`; if refresh fails it clears the session and redirects to sign-in.

List filters use Ransack (`q[name_cont]`, `q[active_eq]`) and snake_case query keys (`per_page`).

## Routes

Protected routes use `meta.requiresAuth`. Guest-only routes use `meta.requiresGuest`. The guard restores the session via the refresh cookie before deciding. Unauthenticated visits to protected pages go to `signIn?redirect=`. Authenticated visits to guest pages go to the monthly statement.

### Public / guest

| Name             | Path                   | Auth   |
| ---------------- | ---------------------- | ------ |
| `signIn`         | `/users/sign-in`       | Guest  |
| `signUp`         | `/users/sign-up`       | Guest  |
| `forgotPassword` | `/users/password/new`  | Guest  |
| `resetPassword`  | `/users/password/edit` | Guest  |
| `confirmEmail`   | `/users/confirmation`  | Public |
| `notFound`       | `/*`                   | Public |

### Authenticated

| Name                                                    | Path                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| `monthly_statement`                                     | `/`                                                              |
| `transactions` · `transactionsNew` · `transactionsEdit` | `/transactions` · `/transactions/new` · `/transactions/edit/:id` |
| `creditCards` · `creditCardsNew` · `creditCardsEdit`    | `/credit-cards` · `/credit-cards/new` · `/credit-cards/edit/:id` |
| `accounts` · `accountsNew` · `accountsEdit`             | `/accounts` · `/accounts/new` · `/accounts/edit/:id`             |
| `institutions` · `institutionsNew` · `institutionsEdit` | `/institutions` · `/institutions/new` · `/institutions/edit/:id` |
| `categories` · `categoriesNew` · `categoriesEdit`       | `/categories` · `/categories/new` · `/categories/edit/:id`       |
| `tags` · `tagsNew` · `tagsEdit`                         | `/tags` · `/tags/new` · `/tags/edit/:id`                         |
| `notifications` · `notificationsShow`                   | `/notifications` · `/notifications/:id`                          |
| `profile`                                               | `/users/profile`                                                 |

Profile also covers name, email change, and password change (same page).

## Authentication

The access token lives in Pinia memory (not `localStorage`). The API sets an encrypted httpOnly `refresh_token` cookie. `rememberMe` is stored in `localStorage` so refresh can request a long-lived cookie.

Typical flow:

1. Register — `/users/sign-up`
2. Confirm email — `/users/confirmation` (token from the API email; inspect in Mailpit locally)
3. Sign in — `/users/sign-in` → Bearer `token` in memory; refresh cookie from the API
4. Protected pages send `Authorization: Bearer <token>`
5. On expiry, `apiRequest` refreshes via `PATCH /api/v1/user/session/refreshes` (cookie + `remember_me`)
6. Sign out — `DELETE /api/v1/user/session/revokes`, then clear local session

Password change, password reset, and email change revoke refresh sessions on the API. The current Bearer token remains valid until it expires.

## Locale

Supported locales: `en` (default) and `pt-BR`. UI copy always goes through `useI18n()` / `t()` — never hardcoded strings.

Resolution:

1. Authenticated: `user.configs.locale` when set
2. Cookie `locale`
3. English

The client writes the `locale` cookie on every API request (`ensureLocaleCookie`). Switching locale while signed in PATCHes the profile (`configs.locale`). Date, currency, and timezone follow the locale (`pt-BR` → BRL / `America/Sao_Paulo`; `en` → USD / `America/New_York`).

Shared copy lives in `src/locales/common/`; domain copy in `src/locales/<domain>/` (`en.ts` + `pt-BR.ts`).

## WebSockets

Action Cable is used at `VITE_CABLE_URL`. The browser cannot set `Authorization` on the handshake, so the client appends `?token=<session token>`. Reconnect uses exponential backoff (cap 30s) and refreshes the token when needed. The socket closes when the last subscription is removed.

| Channel                | When                                             | Payload                              |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| `NotificationChannel`  | Signed-in shell (`useInboxNotificationsChannel`) | Inbox preview / unread count updates |
| `MonthlyStatusChannel` | Monthly statement for a given `month` + `year`   | `{ processing, last_processed_at }`  |

## Deployment

Production app: [https://vue.financialcontrol.app.br/](https://vue.financialcontrol.app.br/)

Configured for Vercel (`vercel.json`):

- SPA fallback: all paths rewrite to `/index.html`
- Security headers: CSP, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`
- `vite preview` reuses the same headers locally

For production:

- Set `VITE_API_BASE_URL` and `VITE_CABLE_URL` at **build** time (https / wss of the real API).
- Set the API `CORS_ORIGINS` and `FRONTEND_URL` to this origin.
- CSP `connect-src` allows `'self' https: wss:` so the baked-in API origin can be reached.
- Do not commit `.env`. Use the host’s env UI for `VITE_*` values.

## Troubleshooting

**Blank page or API calls fail with CORS / network error**

- API must be up: `http://localhost:3000/up`
- `.env` `VITE_API_BASE_URL` must match that origin (no trailing slash)
- API `CORS_ORIGINS` must include `http://localhost:5173`
- Restart `make dev` after changing `.env` (Vite inlines env on boot)

**Sign-in works but the next reload kicks back to login**

- Refresh uses the httpOnly cookie with `credentials: 'include'`
- Cookie `SameSite=Lax`; `Secure` in production — local http is fine, mixed http/https is not
- Confirm the API `FRONTEND_URL` / CORS credentials config

**WebSocket does not connect**

- `VITE_CABLE_URL` should be `ws://localhost:3000/cable` locally and `wss://.../cable` in production
- Handshake needs a valid session token (`?token=`)
- Rejected when the user is inactive or the token is missing/invalid

**Port 5173 already in use**

Stop the other Vite process, or start with a different port (`pnpm dev -- --port 5174`) and update API CORS accordingly.

**Playwright browsers missing**

```bash
make playwright-install
```

**E2E against preview instead of the dev server**

Unset `CI`, or run `make test-e2e` without `CI=1`. With `CI` set, Playwright builds/previews on port 4173.

**Type-check or build fails after pulling**

```bash
pnpm install
make type-check
make build
```
