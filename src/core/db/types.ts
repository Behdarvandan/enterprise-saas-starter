/** A query or resource scoped to a specific tenant (organization/agency). */
export interface TenantScopedQuery {
  tenantId: string;
}

/**
 * Placeholder Database shape. Core stays decoupled from the app's actual
 * generated schema — callers supply their own concrete Database type as the
 * generic argument to `createCoreServerClient`/`createCoreBrowserClient` for
 * full column-level type safety. Shaped like Supabase's generated `Database`
 * type (public.Tables/Views/Functions/Enums/CompositeTypes) rather than a
 * bare `Record<string, unknown>`, so `.from(table)` resolves usable
 * `Record<string, unknown>` Row/Insert/Update types for untyped callers
 * instead of collapsing to `never`.
 */
type GenericTableOrView = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type GenericDatabase = {
  public: {
    Tables: Record<string, GenericTableOrView>;
    Views: Record<string, GenericTableOrView>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
};
