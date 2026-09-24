/** A query or resource scoped to a specific tenant (organization/agency). */
export interface TenantScopedQuery {
  tenantId: string;
}

/**
 * Placeholder Database shape. Core stays decoupled from the app's actual
 * generated schema — callers supply their own concrete Database type as the
 * generic argument to `createCoreServerClient`/`createCoreBrowserClient` for
 * full column-level type safety.
 */
export type GenericDatabase = Record<string, unknown>;
