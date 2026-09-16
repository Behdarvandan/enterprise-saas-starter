# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Nimbus — a multi-tenant booking/scheduling SaaS starter (Next.js 15 App Router,
single deployable unit) with Postgres row-level tenant isolation, an AI
knowledge-base chatbot (RAG over `pgvector`), and dual payment providers
(Stripe / PayTR).

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build         # production build
npm run start         # run the production build locally
npm run lint           # eslint src

npx tsc --noEmit       # typecheck (no separate script; run after non-trivial changes)

npx playwright install # one-time browser install
npx playwright test    # full e2e suite (starts its own dev/prod server per playwright.config.ts)
npx playwright test e2e/app.spec.ts        # single file
npx playwright test -g "test name"          # single test by title
```

Database (requires the Supabase CLI, and `supabase link --project-ref <ref>` once):

```bash
supabase db push       # apply supabase/migrations/*.sql
```

Local container (optional; Vercel does not use Docker):

```bash
docker compose up --build
```

There is no unit test runner configured — Playwright (`e2e/`) is the only
automated test suite. CI (`.github/workflows/ci-cd.yml`) runs lint + build,
then a separate job builds + runs the full Playwright suite, on every push/PR
to `main`. Deployment is handled entirely by Vercel's GitHub integration, not
by that workflow.

## Architecture

**Everything is one Next.js app.** Routes, API handlers, and Server
Actions all talk directly to Supabase Postgres via `@supabase/ssr` — there is
no separate backend service.

**Routing / locales**: all UI routes live under `src/app/[locale]/...`
(`en` unprefixed, `tr` prefixed — `next-intl`, config in `src/i18n/routing.ts`).
API routes under `src/app/api/**` are *outside* `[locale]` and must stay that
way — `src/middleware.ts` explicitly excludes `api/*` from the i18n/session
middleware so route handlers can manage their own Supabase client without a
locale-routing pass in front of them. Translation strings live in
`messages/{en,tr}.json`.

**Supabase client boundary** (`src/lib/supabase/`) — pick the right one:

- `server.ts` `createClient()` — Server Components / Server Actions / Route
  Handlers. RLS-scoped, cookie-bound.
- `client.ts` — Client Components only.
- `admin.ts` `createAdminClient()` — service-role key, **bypasses RLS**.
  Server-only, reserved for privileged paths like webhook handlers. Never
  import from a Client Component.
- `middleware.ts` `updateSession()` — session/cookie refresh, called from
  `src/middleware.ts` after `next-intl`'s routing pass.

**Multi-tenancy is enforced in the database, not application code.** Every
tenant-scoped table has RLS policies gated through `public.is_org_member()`
(see `supabase/migrations/20240101000001_rls_policies.sql`). When adding a
new tenant-scoped table, add matching RLS policies in the same migration —
don't rely on filtering by `organization_id` in TypeScript. A
`BEFORE INSERT/UPDATE` trigger (`prevent_appointment_overlap`) row-locks the
organization to prevent double-booking directly in Postgres.

**Payment provider abstraction** (`src/lib/payment/adapter.ts`): `StripeAdapter`
and `PayTRAdapter` both implement the same `PaymentAdapter` interface
(`createCheckoutSession` / `handleWebhookEvent` / `cancelSubscription`).
Checkout routes (`src/app/api/checkout/**`) and webhook routes
(`src/app/api/webhooks/**`) call `getPaymentAdapter()` and must stay
provider-agnostic — never branch on Stripe- or PayTR-specific fields outside
this file. The active provider is `NEXT_PUBLIC_PAYMENT_PROVIDER`, but a
webhook route may pin a specific provider explicitly. Side effects (writing
subscription/appointment state) live in `src/lib/payment/handlers.ts`, shared
by both adapters.

**RAG chatbot** (`src/lib/rag/`, `src/app/api/rag/ingest`,
`src/app/api/chat/rag`): documents are chunked and embedded with OpenAI
(`text-embedding-3-small`), stored in Postgres via `pgvector` with an HNSW
index, and retrieved through the `match_document_chunks` RPC (never raw
similarity SQL from the app). Chat completions stream from Groq
(`llama-3.3-70b-versatile`) with an automatic fallback to OpenAI's
`gpt-4o-mini` when `GROQ_API_KEY` is absent.

**Rate limiting**: public/anonymous API routes (e.g. booking slots) use
Upstash Redis via `src/lib/rate-limit.ts`, keyed per organization/IP.

**Error tracking**: Sentry is configured for all three runtimes —
`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
— wired through `next.config.js` via `withSentryConfig`.

## Conventions

- Path alias `@/*` → `src/*` (see `tsconfig.json`).
- Server Components by default; add `"use client"` only when state, effects,
  or browser APIs are required.
- `shadcn/ui` components live in `src/components/ui/` (Radix + CVA,
  `components.json` config, `neutral` base color, no prefix), alongside
  `LegacyButton`/`LegacyCard`, which are still widely used across the app —
  check existing usage in a given screen before picking one or the other.
- Dark violet theme: `bg-slate-950` canvas, `bg-slate-900`/`border-slate-800`
  cards, `text-slate-100` headings, `text-slate-400` secondary text,
  `font-mono` for metrics/numbers, `violet-600` primary accent,
  `bg-emerald-500 animate-pulse` for active/live status indicators.
- Strict TypeScript — no `any`; prefer the generated types in
  `src/types/database.ts` and shared contracts in `src/types/index.ts`.
- Never call Stripe/PayTR SDKs or raw `pgvector` SQL directly from route
  handlers — go through `src/lib/payment/adapter.ts` and the
  `match_document_chunks` RPC respectively.
- All comments, commit messages, and generated documentation must be in
  English.

## Automation Skills
- Use `.claude/skills/build-check.sh` to verify Next.js production build integrity.
- Use `.claude/skills/db-types.sh` to generate TypeScript types from Supabase schema.
- Use `.claude/skills/lint.sh` to check code style and ESLint rules.
- Use `.claude/skills/pre-pr.sh` to run lint, typecheck, and build-check sequentially before PR.
- Use `.claude/skills/test-affected.sh` to run tests for changed or affected files.
- Use `.claude/skills/typecheck.sh` to run TypeScript static type checking (`npx tsc --noEmit`).
