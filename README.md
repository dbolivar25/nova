# Nova

Nova is a calm space for daily reflection. Users sign in with Clerk, capture a single journal entry per day with curated prompts, revisit their history through calendars and search, chat with the Nova assistant, and receive weekly insights generated from their own writing.

## Table of contents

1. [Key capabilities](#key-capabilities)
2. [Architecture overview](#architecture-overview)
3. [Database model](#database-model)
4. [Local development](#local-development)
5. [Environment variables](#environment-variables)
6. [Background jobs & cron](#background-jobs--cron)
7. [API surface](#api-surface)
8. [Useful scripts](#useful-scripts)
9. [Contributing notes](#contributing-notes)

## Key capabilities

- **Daily journaling workflow** – Automatically creates the current-day entry, surfaces three rotating prompts, autosaves responses, tracks completion progress, and keeps a freeform writing space.【F:src/app/(dashboard)/journal/today/page.tsx†L1-L160】【F:src/features/journal/hooks/use-journal.ts†L1-L120】
- **History & analytics** – Calendar navigation, entry preview, mood badges, word counts, streak tracking, recent entry list, and aggregate stats driven by live Supabase data.【F:src/app/(dashboard)/journal/page.tsx†L1-L160】【F:src/app/(dashboard)/dashboard/page.tsx†L1-L160】
- **Journal search & filters** – Query entries by text, mood, or "On This Day" directly from API-backed TanStack Query hooks.【F:src/features/journal/hooks/use-journal.ts†L121-L200】【F:src/app/api/journal/entries/route.ts†L1-L200】
- **Nova AI conversations** – Streaming chat UI with persisted threads, automatic title generation, contextual memory from recent journal entries, and BAML-powered responses using SSE.【F:src/app/(dashboard)/nova/page.tsx†L1-L160】【F:src/app/api/nova/chat/route.ts†L1-L200】
- **Weekly insights generation** – Manual trigger and scheduled cron job synthesize emotional trends, key themes, growth moments, and week-ahead suggestions from user entries via BAML flows, storing results in Supabase.【F:src/app/(dashboard)/insights/page.tsx†L1-L160】【F:src/features/nova/services/insights-service.ts†L1-L200】
- **User management & export** – Clerk secures protected routes, while Supabase stores profiles, preferences, chat history, and supports data export endpoints.【F:src/middleware.ts†L1-L20】【F:src/app/api/user/export/route.ts†L1-L200】

## Architecture overview

| Layer | Details |
| --- | --- |
| Frontend | Next.js 15 App Router with React 19, TypeScript, Tailwind, and Shadcn UI primitives. Client state uses TanStack Query with suspense-friendly providers and React Query DevTools in non-production builds.【F:src/app/providers.tsx†L1-L160】 |
| Authentication | Clerk protects dashboard routes via middleware and issues JWTs for Supabase row-level security. |
| Data | Supabase Postgres holds journal entries, prompt responses, Nova chat threads, weekly insights, and user preferences. SQL schema and migrations live in `/supabase`.【F:supabase/schema.sql†L1-L200】 |
| AI orchestration | BAML defines OpenAI GPT-5 client profiles and generates TypeScript SDKs consumed by Nova chat and insights services.【F:baml_src/clients.baml†L1-L160】【F:baml_src/generators.baml†L1-L40】 |
| API routes | App Router handlers under `src/app/api` wrap Supabase access, enforce auth, and expose REST/streaming endpoints for journals, Nova chat, insights, cron, and user operations.【F:src/app/api/journal/entries/route.ts†L1-L200】【F:src/app/api/nova/chat/route.ts†L1-L200】 |
| Background jobs | A Vercel cron POSTs to `/api/cron/weekly-insights` with a shared secret to refresh insights automatically.【F:src/app/api/cron/weekly-insights/route.ts†L1-L160】 |

### Directory highlights

```
src/
  app/              # App Router routes, layouts, and API handlers
  components/       # Shared UI primitives and feature-specific components
  features/         # Domain logic for journal, insights, Nova, and user prefs
  integrations/     # Generated BAML client used by services
  shared/           # Supabase helpers, site metadata, utils, theming
  test/             # Vitest setup and utilities
supabase/           # Schema, migrations, RLS policies, prompt seeds
baml_src/           # BAML clients, generators, and flow definitions
```

## Database model

The Supabase schema includes the following primary tables and enums (see `supabase/schema.sql` for full DDL):

- `users` / `user_preferences` – Clerk identities and product settings.
- `journal_prompts`, `journal_entries`, `prompt_responses` – Daily writing workflow, word counts, and curated prompts.
- `ai_conversations` and chat thread tables introduced via migrations for Nova history.
- `weekly_insights` and `user_personality` – Persisted AI analysis, enabling week-over-week comparisons.
- Enum types: `mood_type` (journal mood tagging) and `insight_type` (insight categories).
- RLS policies enforce per-user access and allow public read-only prompts.【F:supabase/schema.sql†L1-L200】

Apply the migrations in `supabase/migrations` and the base schema before running locally.

## Local development

1. **Install prerequisites**
   - Node.js 20+
   - pnpm 10+
   - Supabase CLI (for running the local database or applying migrations)
   - BAML CLI (`npm i -g @boundaryml/baml-cli`)

2. **Install dependencies**
   ```bash
   pnpm install
   ```
   The postinstall hook regenerates the BAML TypeScript client.

3. **Configure environment**
   - Copy `.env.example` (create it if needed) to `.env.local` and set the variables listed below.
   - Provide Supabase, Clerk, OpenAI, and cron secrets.

4. **Prepare the database**
   ```bash
   # Example using Supabase CLI
   supabase db push --file supabase/schema.sql
   supabase db push --file supabase/migrations/add_nova_chat_threads.sql
   supabase db push --file supabase/migrations/add_service_role_policy.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed-prompts.sql  # optional prompt reseed
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```
   This runs BAML codegen and starts Next.js with Turbopack at `http://localhost:3000`.

6. **Execute tests & checks**
   ```bash
   pnpm test           # Vitest unit and hook tests
   pnpm lint           # ESLint flat config
   pnpm typecheck      # TypeScript project validation
   pnpm check-all      # Convenience: typecheck + lint + test
   ```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk frontend key for the Next.js SDK. |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend key used by API routes. |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL for client and server helpers.【F:src/shared/lib/supabase/client.ts†L1-L40】 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key for browser access with RLS.【F:src/shared/lib/supabase/client.ts†L1-L40】 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key required by cron jobs and server-side insight storage.【F:src/shared/lib/supabase/server.ts†L1-L40】 |
| `OPENAI_API_KEY` | ✅ | OpenAI key consumed by BAML GPT-5 clients for chat and insights.【F:baml_src/clients.baml†L1-L160】 |
| `CRON_SECRET` | ✅ (prod) | Shared bearer token expected by `/api/cron/weekly-insights`.【F:src/app/api/cron/weekly-insights/route.ts†L1-L80】 |
| `NEXT_PUBLIC_SITE_URL` | Optional | Overrides canonical site URL metadata.【F:src/shared/lib/site-metadata.ts†L1-L80】 |
| `NEXT_PUBLIC_VERCEL_BRANCH_URL`, `NEXT_PUBLIC_VERCEL_URL`, `VERCEL_URL` | Optional | Auto-set in Vercel deployments for metadata resolution.【F:src/shared/lib/site-metadata.ts†L1-L80】 |

## Background jobs & cron

- **Weekly insights** – Schedule a weekly POST to `/api/cron/weekly-insights` with header `Authorization: Bearer $CRON_SECRET`. The handler finds active users, runs BAML analysis for the previous week, and stores the results in Supabase.【F:src/app/api/cron/weekly-insights/route.ts†L1-L160】
- **Manual regeneration** – Users can trigger `/api/insights/generate` from the Insights page. Pass `{ "force": true }` to bypass the duplicate guard.【F:src/app/api/insights/generate/route.ts†L1-L120】

## API surface

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/journal/entries` | GET/POST | List, filter, and create journal entries with prompt responses and mood metadata.【F:src/app/api/journal/entries/route.ts†L1-L200】 |
| `/api/journal/entries/[id]` | GET/PUT/DELETE | Fetch, update, or delete an entry by ID. |
| `/api/journal/entries/[date]` | GET/PUT | Date-based entry access used for today’s autosave experience.【F:src/app/api/journal/entries/[date]/route.ts†L1-L200】 |
| `/api/journal/prompts` & `/today` | GET | Retrieve curated prompt catalog or daily selection.【F:src/app/api/journal/prompts/route.ts†L1-L160】【F:src/app/api/journal/prompts/today/route.ts†L1-L200】 |
| `/api/nova/chat` | POST (SSE) | Stream Nova assistant responses with journal-aware context.【F:src/app/api/nova/chat/route.ts†L1-L200】 |
| `/api/nova/chats` | GET/POST | Manage chat threads and titles. |
| `/api/insights/latest` | GET | Fetch the most recent weekly insights.【F:src/app/api/insights/latest/route.ts†L1-L200】 |
| `/api/insights/generate` | POST | Generate or regenerate insights for the current week.【F:src/app/api/insights/generate/route.ts†L1-L120】 |
| `/api/user` & `/user/preferences` | GET/PUT | Initialize user rows and manage preferences. |
| `/api/user/export` | GET | Export the user’s journal, prompts, and chat history as JSON archive.【F:src/app/api/user/export/route.ts†L1-L200】 |

## Useful scripts

- `pnpm dev` – Run BAML codegen and launch the Next.js dev server.
- `pnpm baml:dev` – Hot-reload BAML flows when iterating on AI prompts or schemas.
- `pnpm build && pnpm start` – Create and serve a production build.
- `pnpm test:coverage` – Generate Vitest coverage reports for hooks and services.

## Contributing notes

- Follow the Conventional Commit format (`type(scope): summary`).
- Keep changes small and run `pnpm check-all` before opening a PR.
- Add regression tests beside the affected module (`*.test.ts(x)`).
- Surface new environment variables or migrations in your PR description to keep deployments aligned.
