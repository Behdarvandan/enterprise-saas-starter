// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG = "aaaaaaaa-0000-4000-8000-000000000001";
const DOC_A = "bbbbbbbb-0000-4000-8000-00000000000a";
const DOC_B = "bbbbbbbb-0000-4000-8000-00000000000b";

const requireMembershipMock = vi.fn();
const getEmbeddingMock = vi.fn();
const deleteSelectMock = vi.fn();
const deleteInMock = vi.fn();
const chunkDeleteEqMock = vi.fn();
const statusUpdateMock = vi.fn();
const chunkInsertMock = vi.fn();

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireMembershipOrResponse: requireMembershipMock }));
vi.mock("@/lib/rag/embeddings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rag/embeddings")>()),
  getEmbedding: getEmbeddingMock,
}));

/** A chainable stand-in for the RLS client, recording only what the routes assert on. */
function client() {
  return {
    from: (table: string) => {
      if (table === "documents") {
        return {
          insert: () => ({ select: () => ({ single: async () => ({ data: { id: DOC_A }, error: null }) }) }),
          update: (values: unknown) => ({
            eq: async (_column: string, id: string) => {
              statusUpdateMock(values, id);
              return { error: null };
            },
          }),
          delete: () => ({
            in: (_column: string, ids: string[]) => {
              deleteInMock(ids);
              return { eq: () => ({ select: deleteSelectMock }) };
            },
          }),
        };
      }
      return {
        insert: chunkInsertMock,
        delete: () => ({ eq: chunkDeleteEqMock }),
      };
    },
  };
}

const { DELETE, POST } = await import("./route");

const json = (method: string, body: unknown, url = "http://localhost/api/rag/ingest") =>
  new Request(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("/api/rag/ingest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    requireMembershipMock.mockResolvedValue({
      supabase: client(),
      user: { id: "user-1" },
      membership: { organizationId: ORG, role: "owner" },
    });
    getEmbeddingMock.mockResolvedValue(new Array(1536).fill(0));
    chunkInsertMock.mockResolvedValue({ error: null });
    chunkDeleteEqMock.mockResolvedValue({ error: null });
  });

  describe("DELETE", () => {
    it("bulk-deletes and reports ids that were not found", async () => {
      deleteSelectMock.mockResolvedValue({ data: [{ id: DOC_A }], error: null });
      const response = await DELETE(json("DELETE", { documentIds: [DOC_A, DOC_B] }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ deleted: 1, notFound: [DOC_B] });
      expect(deleteInMock).toHaveBeenCalledWith([DOC_A, DOC_B]);
    });

    it("de-duplicates ids", async () => {
      deleteSelectMock.mockResolvedValue({ data: [{ id: DOC_A }], error: null });
      await DELETE(json("DELETE", { documentIds: [DOC_A, DOC_A] }));
      expect(deleteInMock).toHaveBeenCalledWith([DOC_A]);
    });

    it("still supports the single ?documentId= form", async () => {
      deleteSelectMock.mockResolvedValue({ data: [{ id: DOC_A }], error: null });
      const response = await DELETE(
        new Request(`http://localhost/api/rag/ingest?documentId=${DOC_A}`, { method: "DELETE" }),
      );
      expect(await response.json()).toEqual({ deleted: 1, notFound: [] });
    });

    it.each([
      ["an empty list", { documentIds: [] }],
      ["a non-uuid id", { documentIds: ["nope"] }],
      ["more than 100 ids", { documentIds: Array.from({ length: 101 }, () => DOC_A) }],
      ["a missing body", null],
    ])("rejects %s with invalid_body", async (_label, body) => {
      const response = await DELETE(json("DELETE", body));
      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe("invalid_body");
      expect(deleteInMock).not.toHaveBeenCalled();
    });

    it("returns 404 when nothing matched the caller's organization", async () => {
      deleteSelectMock.mockResolvedValue({ data: [], error: null });
      const response = await DELETE(json("DELETE", { documentIds: [DOC_A] }));
      expect(response.status).toBe(404);
      expect((await response.json()).code).toBe("not_found");
    });

    it("passes an auth failure straight through", async () => {
      const denied = new Response("no", { status: 401 });
      requireMembershipMock.mockResolvedValue({ response: denied });
      expect(await DELETE(json("DELETE", { documentIds: [DOC_A] }))).toBe(denied);
    });
  });

  describe("POST", () => {
    it("ingests pasted text and marks nothing failed", async () => {
      const response = await POST(json("POST", { title: "FAQ", content: "Hello world" }));
      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({ documentId: DOC_A, chunkCount: 1 });
      expect(statusUpdateMock).toHaveBeenCalledWith({ status: "ready" }, DOC_A);
    });

    it("marks the document failed and removes partial chunks when embedding throws", async () => {
      getEmbeddingMock.mockRejectedValue(new Error("Gemini exploded"));
      const response = await POST(json("POST", { content: "Hello world" }));

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ code: "ingest_failed", documentId: DOC_A });
      expect(chunkDeleteEqMock).toHaveBeenCalledWith("document_id", DOC_A);
      expect(statusUpdateMock).toHaveBeenCalledWith(
        { status: "failed", metadata: { error: "Gemini exploded" } },
        DOC_A,
      );
      expect(statusUpdateMock).not.toHaveBeenCalledWith({ status: "ready" }, DOC_A);
    });

    it("rejects blank content", async () => {
      const response = await POST(json("POST", { content: "   " }));
      expect(response.status).toBe(400);
      expect((await response.json()).code).toBe("content_required");
    });

    it("rejects an unsupported upload before touching the database", async () => {
      const form = new FormData();
      form.append("file", new File(["x"], "malware.exe"));
      const response = await POST(new Request("http://localhost/api/rag/ingest", { method: "POST", body: form }));
      expect(response.status).toBe(415);
      expect((await response.json()).code).toBe("unsupported_type");
      expect(getEmbeddingMock).not.toHaveBeenCalled();
    });

    it("ingests an uploaded text file, defaulting the title to the file name", async () => {
      const form = new FormData();
      form.append("file", new File(["Opening hours: 9-18"], "hours.txt", { type: "text/plain" }));
      const response = await POST(new Request("http://localhost/api/rag/ingest", { method: "POST", body: form }));
      expect(response.status).toBe(201);
    });

    it("reports an unreadable PDF as extract_failed", async () => {
      const form = new FormData();
      form.append("file", new File(["not a pdf"], "bad.pdf", { type: "application/pdf" }));
      const response = await POST(new Request("http://localhost/api/rag/ingest", { method: "POST", body: form }));
      expect(response.status).toBe(422);
      expect((await response.json()).code).toBe("extract_failed");
    });
  });
});
