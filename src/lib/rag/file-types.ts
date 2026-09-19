/** Which uploads the knowledge base accepts. Pure — shared by the drop zone and the ingest route. */

export type FileKind = "pdf" | "text" | "html";

const EXTENSIONS: Record<FileKind, readonly string[]> = {
  pdf: ["pdf"],
  text: ["txt", "md", "markdown", "csv", "json"],
  html: ["html", "htm"],
};

export const ACCEPT_ATTRIBUTE = Object.values(EXTENSIONS)
  .flat()
  .map((ext) => `.${ext}`)
  .join(",");

/** Per-file upload ceiling (bytes). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Ceiling on extracted text (characters) — bounds embedding cost per document. */
export const MAX_CONTENT_LENGTH = 500_000;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

/** Classifies by extension (browsers report unreliable MIME types for .md/.csv). */
export function classifyFile(name: string): FileKind | null {
  const ext = extensionOf(name);
  for (const kind of Object.keys(EXTENSIONS) as FileKind[]) {
    if (EXTENSIONS[kind].includes(ext)) return kind;
  }
  return null;
}

export type FileRejection = "unsupported_type" | "too_large" | "empty";

/** Client-side pre-check so obvious rejects never leave the browser. */
export function validateFile(file: { name: string; size: number }): FileRejection | null {
  if (file.size === 0) return "empty";
  if (file.size > MAX_FILE_BYTES) return "too_large";
  if (classifyFile(file.name) === null) return "unsupported_type";
  return null;
}

/** File name without its extension, used as the default document title. */
export function titleFromFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  return (dot > 0 ? name.slice(0, dot) : name).trim();
}
