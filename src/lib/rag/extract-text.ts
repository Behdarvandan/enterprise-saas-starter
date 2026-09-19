import { classifyFile, type FileKind } from "@/lib/rag/file-types";

export class UnsupportedFileError extends Error {
  constructor(name: string) {
    super(`Unsupported file type: ${name}`);
    this.name = "UnsupportedFileError";
  }
}

export class ExtractionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ExtractionError";
  }
}

/** Drops markup but keeps readable text: scripts/styles removed, block tags become newlines. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|br)\s*>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

async function pdfToText(data: ArrayBuffer): Promise<string> {
  // Imported lazily: the parser is only needed for PDF uploads.
  const { extractText, getDocumentProxy } = await import("unpdf");
  try {
    const pdf = await getDocumentProxy(new Uint8Array(data));
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  } catch (error) {
    throw new ExtractionError("Could not read the PDF.", { cause: error });
  }
}

export interface ExtractedText {
  kind: FileKind;
  text: string;
}

/** Extracts plain text from an uploaded file according to its type. */
export async function extractText(file: {
  name: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}): Promise<ExtractedText> {
  const kind = classifyFile(file.name);
  if (!kind) throw new UnsupportedFileError(file.name);

  const buffer = await file.arrayBuffer();

  if (kind === "pdf") return { kind, text: await pdfToText(buffer) };

  const decoded = new TextDecoder("utf-8").decode(buffer);
  return { kind, text: kind === "html" ? htmlToText(decoded) : decoded };
}
