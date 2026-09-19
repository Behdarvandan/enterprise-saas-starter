import { createFormatter } from "use-intl";
import en from "../../messages/en.json";

type Tree = { [key: string]: string | string[] | Tree };

function lookup(namespace: string | undefined, key: string): string {
  const path = [...(namespace ? namespace.split(".") : []), ...key.split(".")];
  let node: Tree | string | string[] | undefined = en as Tree;
  for (const part of path) {
    node = typeof node === "object" && !Array.isArray(node) ? node[part] : undefined;
  }
  if (typeof node !== "string") throw new Error(`Missing English message: ${path.join(".")}`);
  return node;
}

/** Minimal ICU: `{name}` interpolation only (enough for the plural-free test paths). */
function interpolate(message: string, values?: Record<string, string | number>): string {
  return message.replace(/\{(\w+)\}/g, (_, name: string) => String(values?.[name] ?? `{${name}}`));
}

/** A `t()` backed by the real English catalog, so tests assert the copy users actually see. */
export function englishTranslator(namespace?: string) {
  return (key: string, values?: Record<string, string | number>) => interpolate(lookup(namespace, key), values);
}

/**
 * Factory for `vi.mock("next-intl/server", …)`. Usage:
 *   vi.mock("next-intl/server", async () => (await import("@/test/intl")).nextIntlServerMock());
 */
export function nextIntlServerMock() {
  return {
    getTranslations: async (arg?: string | { namespace?: string }) =>
      englishTranslator(typeof arg === "string" ? arg : arg?.namespace),
    getLocale: async () => "en",
    getFormatter: async () => createFormatter({ locale: "en", timeZone: "UTC" }),
  };
}

export { en as englishMessages };
