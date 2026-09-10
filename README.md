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
├── app/                    # App Router (landing, login, protected dashboard)
├── components/
│   ├── auth/               # SignOutButton
│   ├── layout/             # Header & Footer
│   └── ui/                 # Button & Card atoms
├── lib/
│   ├── supabase/           # client.ts, server.ts, middleware.ts helpers
│   └── utils.ts            # cn() class merging
├── middleware.ts           # Session refresh middleware
└── types/                  # Shared TypeScript contracts
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

To enable full-typed queries, generate your database types and add them to
`src/types/database.ts`:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

## Production Build & Docker

```bash
npm run build
npm run start

# Containerized (recommended)
docker compose up --build
```

The image runs as a non-root user and ships only the standalone runtime.
