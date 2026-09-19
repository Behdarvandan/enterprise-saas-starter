// @vitest-environment node
import { describe, expect, it } from "vitest";
import { GENERIC_AGENCY_ERROR, isKnownAgencyRpcError, mapAgencyRpcError } from "./rpc-errors";

describe("mapAgencyRpcError", () => {
  it.each([
    "not_agency_admin",
    "not_tenant_owner",
    "tenant_is_master",
    "tenant_already_linked",
    "tenant_not_in_agency",
    "quota_pool_exceeded",
    "quota_below_consumed",
    "invalid_quota",
    "invalid_name",
    "invalid_slug",
    "slug_taken",
  ])("maps %s to its own message key", (key) => {
    expect(mapAgencyRpcError({ message: key })).toBe(key);
    expect(isKnownAgencyRpcError({ message: key })).toBe(true);
  });

  it("never leaks raw database text", () => {
    const raw = 'duplicate key value violates unique constraint "organizations_slug_key"';
    expect(mapAgencyRpcError({ message: raw })).toBe(GENERIC_AGENCY_ERROR);
    expect(isKnownAgencyRpcError({ message: raw })).toBe(false);
  });

  it("handles missing errors", () => {
    expect(mapAgencyRpcError(null)).toBe(GENERIC_AGENCY_ERROR);
    expect(mapAgencyRpcError({})).toBe(GENERIC_AGENCY_ERROR);
  });
});
