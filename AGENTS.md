# Repository Guidelines

## Project Structure & Module Organization

Nova uses the Next.js App Router; routes and layouts live in `app/` with shared
providers in `app/providers`. Components sit under `components/` (UI primitives
in `components/ui`, journaling and agent views in `components/journal` and
`components/nova`). Shared helpers live in `lib/` and `hooks/`. BAML contracts
stay in `baml_src/`; rerun codegen when they change. Database SQL sits in
`supabase/`, static assets in `public/`, and Vitest helpers in `test/`.
Co-locate specs with their subject using `*.test.ts(x)`.

## Build, Test, and Development Commands

- `pnpm install`: sync dependencies and regenerate BAML clients.
- `pnpm dev`: run BAML codegen, then start Next dev with Turbopack.
- `pnpm build` → `pnpm start`: produce and preview a production build.
- `pnpm lint`: run the Next/ESLint flat config.
- `pnpm typecheck`: TypeScript project validation.
- `pnpm test`/`test:watch`/`test:coverage`/`test:ui`: Vitest CLI, watch,
  coverage, and inspector modes.
- `pnpm baml:dev`: hot-reload BAML flows.
- `pnpm check-all`: typecheck + lint + Vitest before PRs.

## Coding Style & Naming Conventions

TypeScript is default with 2-space indent, double quotes, and semicolons
enforced by ESLint. Use PascalCase for React components, camelCase for functions
and variables, and SCREAMING_CASE only for exported constants. Prefer server
components; mark client components with `'use client'`. Tailwind styling should
group utilities by layout, color, then motion, and rely on the `cn` helper from
`lib/utils`. Import shared modules via the `@/` aliases configured in
`tsconfig.json` and `vitest.config.ts`.

## Testing Guidelines

Vitest runs in JSDOM with Testing Library primed by `test/setup.ts`. Prefer
declarative queries (`screen.findByRole`) and verify user-visible behavior. Name
specs after their subject (`journal-entry.test.tsx`), reuse helpers from
`test/utils.tsx`, and run `pnpm test:coverage` for logic-heavy changes. Add
regression tests with every bugfix.

## Commit & Pull Request Guidelines

Use a Conventional Commit style for clarity:
`<type>(scope): short imperative summary`. Keep subjects under 70 chars,
describe why in the body, and end with `BREAKING CHANGE:` when behavior shifts.
Favor scope names that match app folders (`app`, `hooks`, `baml`). Commits
should be small, reversible units with the relevant pnpm commands noted in the
body when fixes rely on tests or codegen. For pull requests, include a clear
summary, linked issues or task IDs, screenshots or recordings for UI updates
(light and dark themes), and the exact checks you ran (e.g., `pnpm check-all`).
Call out new environment variables or Supabase migrations so reviewers can
reproduce the environment quickly, and keep PRs tightly scoped for faster review
cycles.
