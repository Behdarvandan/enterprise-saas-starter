// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getLinkableOrganizations } from "./linkable";

interface Calls {
  memberships: { column: string; value: unknown }[];
}

function client(owned: unknown[], linkedIds: string[], calls: Calls = { memberships: [] }) {
  return {
    from: (table: string) => {
      if (table === "memberships") {
        const chain = {
          select: () => chain,
          eq: (column: string, value: unknown) => {
            calls.memberships.push({ column, value });
            return calls.memberships.length >= 2 ? Promise.resolve({ data: owned, error: null }) : chain;
          },
        };
        return chain;
      }
      return { select: () => ({ in: async () => ({ data: linkedIds.map((tenant_id) => ({ tenant_id })), error: null }) }) };
    },
  } as never;
}

const org = (id: string, name: string) => ({ organizations: { id, name, slug: name.toLowerCase() } });

describe("getLinkableOrganizations", () => {
  it("only asks for organizations the user owns", async () => {
    const calls: Calls = { memberships: [] };
    await getLinkableOrganizations(client([], [], calls), "user-1", { master_tenant_id: "master" });
    expect(calls.memberships).toEqual([
      { column: "user_id", value: "user-1" },
      { column: "role", value: "owner" },
    ]);
  });

  it("excludes the master organization and already-linked ones, sorted by name", async () => {
    const result = await getLinkableOrganizations(
      client([org("master", "Agency HQ"), org("b", "Zeta"), org("c", "Alpha"), org("d", "Linked")], ["d"]),
      "user-1",
      { master_tenant_id: "master" },
    );
    expect(result.map((o) => o.id)).toEqual(["c", "b"]);
  });

  it("skips memberships whose organization row is unreadable", async () => {
    const result = await getLinkableOrganizations(client([{ organizations: null }, org("a", "Acme")], []), "u", {
      master_tenant_id: "m",
    });
    expect(result).toEqual([{ id: "a", name: "Acme", slug: "acme" }]);
  });

  it("returns early when nothing qualifies", async () => {
    expect(await getLinkableOrganizations(client([org("master", "HQ")], []), "u", { master_tenant_id: "master" })).toEqual([]);
  });
});
