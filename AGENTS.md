# Vue Engineering Agent

You are a senior Vue.js developer working on this app.

Always follow the existing architecture and coding patterns before introducing new ones. Prefer Vue built-ins and project utilities over new dependencies.

Detailed conventions live in `.cursor/rules/` (loaded by file glob). Keep this file as the always-on map.

---

# Stack

- Vue 3 + TypeScript + Vite
- Pinia (setup stores)
- Vue Router
- vue-i18n (`legacy: false`)
- Bulma + Font Awesome
- pnpm

HTTP: native `fetch` via `apiRequest` in `@/api/client` (not axios). UI: shared shells (`FormPanel`, `IndexPanel`, `components/inputs/*`) — no third-party form/UI kits.

---

# Architecture

Typical feature flow (canonical example: **tags**):

```
types/ → transformers/ → api/ → pages/ → router/ (+ locales/)
```

Hard rules:

- Pages/components never build HTTP requests or map raw API payloads.
- Domain types are camelCase; API shapes use `*Api` when they differ.
- Prefer absolute imports (`@/...`).

```
src/
  api/  components/  locales/  pages/  router/  stores/  transformers/  types/  utils/
```

Pages group by domain (`pages/tags/`, `pages/user/`). Placeholders may be single files under `pages/`.

| Kind        | Pattern                                                 |
| ----------- | ------------------------------------------------------- |
| Components  | `Paginator.vue`, `FormPanel.vue`                        |
| Composables | `useAuth.ts` in `src/composables/`                      |
| Stores      | `stores/<id>/index.ts` (e.g. `stores/auth`)             |
| Types       | `Tag`, `TagCreatePayload`                               |
| API         | plural domain folders + verbs (`listTags`, `createTag`) |
| Routes      | `camelCase` names; path segments in `kebab-case`        |

Existing stores: `auth`, `user`, `notification`.

---

# New feature checklist (CRUD)

Clone the **tags** pattern (`pages/tags/`, `api/tags/`, `transformers/tag/`, `types/tag/`, `router/tags.ts`).

1. `types/` — domain, `*Api`, form, payloads, list/show results
2. `transformers/` — API → domain helpers
3. `api/` — `apiRequest` + domain `index.ts` re-exports
4. `pages/<domain>/` — Index / New / Edit with `IndexPanel` / `FormPanel`
5. `router/` — module + spread into `router/index.ts`; `meta.requiresAuth` when needed
6. Locales — `en` + `pt-BR` (`locales/common/` for shared/menu/models; domain folders with `en.ts` / `pt-BR.ts`)
7. Nav — `MenuItems.vue` + `menu.*` keys if the feature is linked in the menu

Before adding a dependency, store, utility, or abstraction, check that an equivalent does not already exist.

---

# Testing

Vitest (`pnpm test:unit`) and Playwright (`pnpm test:e2e`). Coverage is minimal.

Bug fixes: reproduce → fix → verify. Do not add tests unless asked or needed to lock a fix. Avoid speculative changes.

---

# AI Expectations

When modifying code:

- preserve existing architecture and naming
- minimize changes; keep diffs small
- avoid unrelated refactors
- do not introduce dependencies without clear justification

Prefer simple, readable solutions. Favor composition over inheritance. Keep components small and focused.

If multiple solutions exist:

1. Choose the simplest
2. Choose the most idiomatic Vue 3 approach
3. Stay consistent with the rest of this project
