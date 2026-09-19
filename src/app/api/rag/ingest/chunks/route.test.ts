// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG = "aaaaaaaa-0000-4000-8000-000000000001";
const DOC = "bbbbbbbb-0000-4000-8000-00000000000a";

const requireMembershipMock = vi.fn();
const limitMock = vi.fn();
const gtMock = vi.fn();

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireMembershipOrResponse: requireMembershipMock }));

const query = {
  eq: () => query,
  gt: (...args: unknown[]) => {
    gtMock(...args);
    return query;
  },
  order: () => query,
  limit: limitMock,
};

const { GET } = await import("./route");

const row = (index: number) => ({ id: `c${index}`, chunk_index: index, content: `chunk ${index}`, token_count: 10 });
const get = (search: string) => GET(new Request(`http://localhost/api/rag/ingest/chunks?${search}`));

describe("GET /api/rag/ingest/chunks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireMembershipMock.mockResolvedValue({
      supabase: { from: () => ({ select: () => query }) },
      membership: { organizationId: ORG },
    });
  });

  it("returns a page and a cursor when more chunks exist", async () => {
    limitMock.mockResolvedValue({ data: [row(0), row(1), row(2)], error: null });
    const body = await (await get(`documentId=${DOC}&limit=2`)).json();
    expect(body.chunks.map((c: { chunkIndex: number }) => c.chunkIndex)).toEqual([0, 1]);
    expect(body.nextCursor).toBe(1);
    expect(limitMock).toHaveBeenCalledWith(3); // limit + 1 look-ahead row
  });

  it("returns a null cursor on the last page and honours the cursor", async () => {
    limitMock.mockResolvedValue({ data: [row(5)], error: null });
    const body = await (await get(`documentId=${DOC}&cursor=4&limit=2`)).json();
    expect(body.nextCursor).toBeNull();
    expect(gtMock).toHaveBeenCalledWith("chunk_index", 4);
  });

  it("never exposes embeddings", async () => {
    limitMock.mockResolvedValue({ data: [row(0)], error: null });
    const body = await (await get(`documentId=${DOC}`)).json();
    expect(Object.keys(body.chunks[0]).sort()).toEqual(["chunkIndex", "content", "id", "tokenCount"]);
  });

  it.each(["", "documentId=nope", `documentId=${DOC}&limit=999`, `documentId=${DOC}&cursor=-5`])(
    "rejects invalid query %j",
    async (search) => {
      const response = await get(search);
      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe("invalid_body");
    },
  );
});
