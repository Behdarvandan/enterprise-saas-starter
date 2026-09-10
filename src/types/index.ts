/**
 * Application-level shared TypeScript contracts.
 */

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface NavItem {
  label: string;
  href: string;
}

/**
 * NOTE: Generate the fully-typed Supabase database schema from your project
 * and place it alongside this file:
 *
 *   npx supabase gen types typescript --project-id <project-ref> \
 *     > src/types/database.ts
 *
 * Then reference it via `createClient<Database>()` in the Supabase helpers.
 */
