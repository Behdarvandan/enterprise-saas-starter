import { describe, expect, it } from "vitest";
import {
  getAdminNavGroups,
  getAgencyNavGroups,
  getDashboardNavGroups,
  resolveActiveHref,
  type ShellNavGroup,
} from "./nav-config";

const hrefs = (groups: ShellNavGroup[]) => groups.flatMap((g) => g.items.map((i) => i.href));

describe("getDashboardNavGroups", () => {
  it("hides the agency portal from regular users", () => {
    expect(hrefs(getDashboardNavGroups(false)).some((h) => h.startsWith("/agency"))).toBe(false);
  });

  it("appends exactly one agency entry for agency admins, leaving the rest intact", () => {
    const regular = hrefs(getDashboardNavGroups(false));
    const admin = hrefs(getDashboardNavGroups(true));
    expect(admin).toEqual([...regular, "/agency/tenants"]);
  });

  it.each([
    ["dashboard", getDashboardNavGroups(true)],
    ["agency", getAgencyNavGroups()],
    ["admin", getAdminNavGroups()],
  ])("%s nav has unique hrefs", (_name, groups) => {
    const all = hrefs(groups);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("resolveActiveHref", () => {
  const all = hrefs(getDashboardNavGroups(true));

  it("matches the overview only on the exact path", () => {
    expect(resolveActiveHref("/dashboard", all)).toBe("/dashboard");
    expect(resolveActiveHref("/dashboard/skills", all)).toBe("/dashboard/skills");
  });

  it("prefers the longest matching prefix for nested routes", () => {
    expect(resolveActiveHref("/dashboard/settings/organization", all)).toBe("/dashboard/settings");
  });

  it("does not match on a partial segment", () => {
    expect(resolveActiveHref("/dashboard/team-invites", all)).toBe("/dashboard");
    expect(resolveActiveHref("/elsewhere", all)).toBeNull();
  });
});
