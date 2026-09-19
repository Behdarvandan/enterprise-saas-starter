// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireMembershipMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireMembershipOrResponse: requireMembershipMock }));
vi.mock("@/lib/dev-crew/queries", () => ({ fetchCrewInsights: fetchMock }));

const { GET } = await import("./route");
const get = (search = "") => GET(new Request(`http://localhost/api/crew-insights?${search}`));

const insight = (n: number) => ({
  id: String(n),
  createdAt: `2026-09-19T00:00:0${n}.123456+00:00`,
  recommendation: "x",
  negativeCount: n,
});

describe("GET /api/crew-insights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireMembershipMock.mockResolvedValue({ membership: { organizationId: "org-1" } });
  });

  it("scopes to the caller's organization and reports hasMore via a look-ahead row", async () => {
    fetchMock.mockResolvedValue([insight(3), insight(2), insight(1)]);
    const body = await (await get("limit=2")).json();
    expect(fetchMock).toHaveBeenCalledWith("org-1", { limit: 3, since: undefined, before: undefined });
    expect(body.insights).toHaveLength(2);
    expect(body.hasMore).toBe(true);
  });

  it("passes since/before cursors through, including microsecond timestamps", async () => {
    fetchMock.mockResolvedValue([]);
    const since = "2026-09-19T00:00:03.123456+00:00";
    const response = await get(`since=${encodeURIComponent(since)}`);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith("org-1", { limit: 21, since, before: undefined });
    expect((await response.json()).hasMore).toBe(false);
  });

  it.each(["since=yesterday", "before=1", "limit=0", "limit=500"])("rejects %s", async (search) => {
    expect((await get(search)).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the auth failure untouched", async () => {
    const denied = new Response("no", { status: 401 });
    requireMembershipMock.mockResolvedValue({ response: denied });
    expect(await get()).toBe(denied);
  });
});
