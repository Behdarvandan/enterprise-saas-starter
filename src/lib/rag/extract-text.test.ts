import { describe, expect, it } from "vitest";
import { ExtractionError, extractText, htmlToText, UnsupportedFileError } from "./extract-text";
import { classifyFile, titleFromFileName, validateFile, MAX_FILE_BYTES } from "./file-types";

const file = (name: string, content: string | Uint8Array) => ({
  name,
  arrayBuffer: async () => {
    const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  },
});

describe("classifyFile", () => {
  it.each([
    ["guide.PDF", "pdf"],
    ["notes.md", "text"],
    ["data.csv", "text"],
    ["page.html", "html"],
    ["archive.zip", null],
    ["README", null],
  ] as const)("%s → %s", (name, kind) => {
    expect(classifyFile(name)).toBe(kind);
  });
});

describe("validateFile", () => {
  it("rejects empty, oversized and unsupported files, accepts the rest", () => {
    expect(validateFile({ name: "a.txt", size: 0 })).toBe("empty");
    expect(validateFile({ name: "a.txt", size: MAX_FILE_BYTES + 1 })).toBe("too_large");
    expect(validateFile({ name: "a.exe", size: 10 })).toBe("unsupported_type");
    expect(validateFile({ name: "a.txt", size: 10 })).toBeNull();
  });
});

describe("titleFromFileName", () => {
  it("strips only the final extension", () => {
    expect(titleFromFileName("refund.policy.v2.pdf")).toBe("refund.policy.v2");
    expect(titleFromFileName(".env")).toBe(".env");
  });
});

describe("htmlToText", () => {
  it("removes scripts, styles and tags but keeps text and paragraph breaks", () => {
    const text = htmlToText(
      "<style>p{}</style><h1>Title</h1><p>Hello &amp; welcome</p><script>alert(1)</script><p>Bye</p>",
    );
    expect(text).toContain("Title");
    expect(text).toContain("Hello & welcome");
    expect(text).not.toMatch(/alert|<|p\{\}/);
    expect(text.split("\n").filter(Boolean).length).toBeGreaterThanOrEqual(3);
  });
});

describe("extractText", () => {
  it("decodes UTF-8 text files, including non-Latin scripts", async () => {
    const result = await extractText(file("tr.txt", "Çalışma saatleri: 9–18 · ساعات کاری"));
    expect(result).toEqual({ kind: "text", text: "Çalışma saatleri: 9–18 · ساعات کاری" });
  });

  it("converts HTML", async () => {
    const result = await extractText(file("a.html", "<p>Hi</p>"));
    expect(result.kind).toBe("html");
    expect(result.text).toBe("Hi");
  });

  it("rejects unsupported types", async () => {
    await expect(extractText(file("a.zip", "x"))).rejects.toBeInstanceOf(UnsupportedFileError);
  });

  it("wraps unreadable PDFs in ExtractionError", async () => {
    await expect(extractText(file("bad.pdf", "not a pdf"))).rejects.toBeInstanceOf(ExtractionError);
  });
});
