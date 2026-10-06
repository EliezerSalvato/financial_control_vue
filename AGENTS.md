# Vue Engineering Agent

You are a senior Vue.js developer working on this app.

Always follow the existing architecture and coding patterns before introducing new ones. Prefer Vue built-ins and project utilities over new dependencies.

# Mandatory Reading

Before making code changes:

1. Read this file (`AGENTS.md`)
2. Read only files relevant to the requested feature
3. Avoid loading unnecessary context
4. Follow the matching rules in `.agents/rules/` (see [Project rules](#project-rules))

## Project rules

This project is used with both Cursor and Claude Code. This file is the single source of instructions: Cursor reads it natively and `CLAUDE.md` only imports it (`@AGENTS.md`). Never add content to `CLAUDE.md`, and do not create `.cursor/rules/` or `.claude/rules/`.

Detailed rules live **only** in `.agents/rules/` as plain Markdown. Before working on a matching task, read the rule file:

| Rule | Read when |
|------|-----------|
| [`.agents/rules/app-shell.md`](.agents/rules/app-shell.md) | Editing router, Pinia stores or i18n (`src/router/**/*.ts`, `src/stores/**/*.ts`, `src/locales/**/*.ts`) |
| [`.agents/rules/code-style.md`](.agents/rules/code-style.md) | Editing any `src/**/*.{ts,vue}` (imports, formatting, style) |
| [`.agents/rules/commit-patterns.md`](.agents/rules/commit-patterns.md) | Creating or suggesting a git commit |
| [`.agents/rules/data-layer.md`](.agents/rules/data-layer.md) | Editing API, transformers or types (`src/api/**/*.ts`, `src/transformers/**/*.ts`, `src/types/**/*.ts`) |
| [`.agents/rules/forms-errors.md`](.agents/rules/forms-errors.md) | Editing forms, validation or error handling (`src/pages/**/*.vue`, `src/utils/errorsHandler.ts`, `src/utils/validators/**`) |
| [`.agents/rules/readme.md`](.agents/rules/readme.md) | Creating or updating `README.md` |
| [`.agents/rules/vue-pages-components.md`](.agents/rules/vue-pages-components.md) | Editing pages or components (`src/pages/**/*.vue`, `src/components/**/*.vue`) |

To add a rule, create `.agents/rules/<name>.md` (plain Markdown, no tool-specific frontmatter) and add a row to this table.

## Hooks

Hooks live in `.agents/hooks/`:

- [`.agents/hooks/hooks.json`](.agents/hooks/hooks.json) — hook definitions (`afterFileEdit` runs `format.sh`)
- [`.agents/hooks/format.sh`](.agents/hooks/format.sh) — runs ESLint `--fix` + Prettier on the edited file

Each tool only reads hooks from its own location, so these files are thin pointers to `.agents/hooks/format.sh` — keep the logic in `.agents/hooks/` and do not duplicate it:

- `.cursor/hooks.json` — Cursor `afterFileEdit`
- `.claude/settings.json` — Claude Code `PostToolUse` (`Edit|Write`)

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
