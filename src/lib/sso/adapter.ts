import { UnsupportedFeatureError } from "@/lib/payment/adapter";

/**
 * SSO/SAML architectural readiness only (Faz 1 Decision 5) — this module
 * defines the shape a future SSO adapter would have, matching the existing
 * `PaymentAdapter` pattern in src/lib/payment/adapter.ts, but ships with no
 * working implementation:
 *
 * - No SAML/OAuth library is installed (no @node-saml/*, no workos).
 * - No `/api/auth/sso/*` route exists to call these methods.
 * - No login-page button or admin-settings UI reads from `sso_connections`.
 *
 * Both methods below throw `UnsupportedFeatureError` unconditionally.
 * Reuses that class from the payment adapter rather than declaring a
 * near-identical one here, since its meaning ("provider doesn't support a
 * requested capability") applies unchanged.
 */
export type SsoConnectionProvider = "okta" | "google_workspace";

export interface SsoLoginUrlInput {
  organizationId: string;
  redirectUri: string;
}

export interface SsoCallbackInput {
  organizationId: string;
  code: string;
  state: string;
}

export interface SsoCallbackResult {
  email: string;
  fullName?: string | null;
}

export interface SsoProvider {
  readonly provider: SsoConnectionProvider;

  /** Would return the IdP's authorization URL to redirect the browser to. */
  getLoginUrl(input: SsoLoginUrlInput): Promise<string>;

  /** Would exchange the IdP's callback code for the authenticated identity. */
  handleCallback(input: SsoCallbackInput): Promise<SsoCallbackResult>;
}

class UnimplementedSsoProvider implements SsoProvider {
  constructor(readonly provider: SsoConnectionProvider) {}

  async getLoginUrl(): Promise<string> {
    throw new UnsupportedFeatureError(
      `SSO login is not yet implemented for provider "${this.provider}".`,
    );
  }

  async handleCallback(): Promise<SsoCallbackResult> {
    throw new UnsupportedFeatureError(
      `SSO callback handling is not yet implemented for provider "${this.provider}".`,
    );
  }
}

/**
 * Factory mirroring `getPaymentAdapter()`'s shape for when a real
 * implementation lands — every provider currently resolves to the same
 * unimplemented stub.
 */
export function getSsoProvider(provider: SsoConnectionProvider): SsoProvider {
  return new UnimplementedSsoProvider(provider);
}
