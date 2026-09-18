// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getDashboardNavItems } from "./nav-items";

describe("getDashboardNavItems", () => {
  it("hides the Agency Portal from regular users", () => {
    const items = getDashboardNavItems(false);
    expect(items.some((item) => item.href.startsWith("/agency"))).toBe(false);
  });

  it("adds the Agency Portal (pointing at /agency/tenants) for agency admins", () => {
    const items = getDashboardNavItems(true);
    const portal = items.find((item) => item.label === "Agency Portal");
    expect(portal?.href).toBe("/agency/tenants");
  });

  it("keeps every regular entry for agency admins too", () => {
    const regular = getDashboardNavItems(false);
    const admin = getDashboardNavItems(true);
    expect(admin.slice(0, regular.length)).toEqual(regular);
    expect(admin).toHaveLength(regular.length + 1);
  });
});
