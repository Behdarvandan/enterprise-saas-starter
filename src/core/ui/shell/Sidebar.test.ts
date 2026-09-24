import { describe, expect, it } from "vitest";
import { resolveActiveHref } from "./Sidebar";

describe("resolveActiveHref", () => {
  const hrefs = ["/dashboard", "/dashboard/skills", "/dashboard/settings"];

  it("matches the overview only on the exact path", () => {
    expect(resolveActiveHref("/dashboard", hrefs)).toBe("/dashboard");
    expect(resolveActiveHref("/dashboard/skills", hrefs)).toBe("/dashboard/skills");
  });

  it("prefers the longest matching prefix for nested routes", () => {
    expect(resolveActiveHref("/dashboard/settings/organization", hrefs)).toBe("/dashboard/settings");
  });

  it("does not match on a partial segment", () => {
    expect(resolveActiveHref("/dashboard/team-invites", hrefs)).toBe("/dashboard");
    expect(resolveActiveHref("/elsewhere", hrefs)).toBeNull();
  });
});
