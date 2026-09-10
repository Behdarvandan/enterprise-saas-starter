# Nimbus SaaS — Enterprise Full-Stack Starter Kit

A production-ready **Next.js 15** SaaS boilerplate with **Supabase** authentication
and database integration, strict modular architecture, and a container-first
deployment pipeline.

## Tech Stack

- **Next.js 15.5** (App Router, React Server Components)
- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS** (custom brand tokens)
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) for auth & data
- **Docker** multi-stage build using Next.js standalone output

## Project Structure

```text
src/
├── app/
│   ├── (marketing)/        # Landing, auth, pricing, invite (Header + Footer)
│   ├── dashboard/          # Authenticated app (sidebar layout)
│   │   ├── billing/        # Subscription & billing portal
│   │   ├── settings/       # Profile & organization settings
│   │   └── team/           # Members & invitations
│   └── api/                # checkout, billing-portal, webhooks/stripe
├── components/
│   ├── auth/               # SignOutButton
│   ├── billing/            # Checkout & billing portal buttons
│   ├── dashboard/          # Sidebar
│   ├── layout/             # Header & Footer (marketing)
│   └── ui/                 # Button & Card atoms
├── lib/
│   ├── supabase/           # client.ts, server.ts, admin.ts, middleware.ts
│   ├── billing.ts          # Organization/customer helpers
│   ├── stripe.ts           # Server + client Stripe helpers
│   ├── team.ts             # Membership & RBAC helpers
│   └── utils.ts            # cn() class merging
├── middleware.ts           # Session refresh middleware
└── types/                  # Database + shared TypeScript contracts
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase project URL and anon key from the
   [Supabase dashboard](https://supabase.com/dashboard).

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Supabase Auth Flow

- **`src/middleware.ts`** refreshes the user session on every request.
- **`/login`** signs users in with email/password via the browser client.
- **`/dashboard`** is a protected Server Component that redirects to `/login`
  when no session exists.

Typed database helpers are wired to `src/types/database.ts`, which mirrors the
SQL migrations in `supabase/migrations/`. To regenerate it from a live project:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

## Database Schema & Migrations

SQL migrations live in `supabase/migrations/`:

- `20240101000000_init_schema.sql` — tables (`profiles`, `organizations`,
  `memberships`), the `membership_role` enum, indexes, triggers, and helper
  functions (`create_organization`, `is_org_member`, `current_user_role`).
- `20240101000001_rls_policies.sql` — Row Level Security policies.

Apply them with the Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Schema summary:

- `profiles` — one row per `auth.users` account (auto-created on signup).
- `organizations` — a tenant / workspace.
- `memberships` — links a profile to an organization with a role
  (`owner`, `admin`, or `member`).

Organizations are created atomically (org + owner membership) via the
`create_organization` RPC, so there is intentionally no insert policy on the
`organizations` table.

## Stripe Billing & Subscriptions

Billing is handled by Stripe. Configure the Stripe env vars (see
`.env.example`), then create the corresponding price IDs in the Stripe
dashboard and wire them to `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE`.

- `/pricing` — plan selection, redirects to Stripe Checkout.
- `/api/checkout` — creates a Checkout Session and returns its id.
- `/api/billing-portal` — opens the Stripe customer billing portal.
- `/api/webhooks/stripe` — verifies webhook signatures and syncs subscription
  state to `organizations` (`checkout.session.completed`,
  `customer.subscription.updated`, `customer.subscription.deleted`).

To test locally, forward Stripe webhooks to your app:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Then set `STRIPE_WEBHOOK_SECRET` to the `whsec_...` value Stripe prints.

## Team & Invitations

Multi-tenant team management:

- `/dashboard/team` — lists organization members, their roles, and pending
  invitations. Owners/admins can invite members, change roles, remove members,
  and revoke invitations.
- `/invite/[token]` — lets an invited user accept an invitation and join the
  organization.

Role-based access control (RBAC) is enforced both in the UI and in server
actions: only `owner`/`admin` roles can manage members and invitations. The
`accept_invitation` RPC runs with `SECURITY DEFINER` so an invited user can join
without already being a member.

## Email, Testing & Error Tracking

- **Transactional email** — `src/lib/email.ts` wraps [Resend](https://resend.com)
  to send invitation and password reset emails. Set `RESEND_API_KEY` (and
  optionally `EMAIL_FROM`) to enable sending.
- **E2E tests** — [Playwright](https://playwright.dev) with a config
  (`playwright.config.ts`) and basic specs in `e2e/`. Run with
  `npx playwright install && npx playwright test`.
- **Error tracking** — [Sentry](https://sentry.io) is wired via
  `sentry.client.config.ts`, `sentry.server.config.ts`,
  `sentry.edge.config.ts`, and `src/instrumentation.ts`. Set
  `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` to start capturing errors. Source map
  upload is disabled by default; set `SENTRY_ORG`, `SENTRY_PROJECT`, and
  `SENTRY_AUTH_TOKEN` (and remove the `sourcemaps.disable` block in
  `next.config.js`) to enable it.

## Production Build & Docker

```bash
npm run build
npm run start

# Containerized (recommended)
docker compose up --build
```

The image runs as a non-root user and ships only the standalone runtime.
