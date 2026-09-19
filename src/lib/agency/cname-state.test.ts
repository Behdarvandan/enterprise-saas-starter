// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { getCnameCheckState } from "./cname-state";

const client = (result: { data: unknown; error: { message: string } | null }) =>
  ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => result }) }) }) }) as never;

describe("getCnameCheckState", () => {
  it("returns the persisted state", async () => {
    const state = await getCnameCheckState(
      client({ data: { cname_last_checked_at: "2026-09-19T10:00:00Z", cname_last_records: ["wrong.example"] }, error: null }),
      "a1",
    );
    expect(state).toEqual({ lastCheckedAt: "2026-09-19T10:00:00Z", records: ["wrong.example"] });
  });

  it("treats null columns as never checked", async () => {
    const state = await getCnameCheckState(client({ data: { cname_last_checked_at: null, cname_last_records: null }, error: null }), "a1");
    expect(state).toEqual({ lastCheckedAt: null, records: [] });
  });

  it("degrades gracefully when the migration is not applied yet", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const state = await getCnameCheckState(client({ data: null, error: { message: "column agencies.cname_last_checked_at does not exist" } }), "a1");
    expect(state).toEqual({ lastCheckedAt: null, records: [] });
  });
});
