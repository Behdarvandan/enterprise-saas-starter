import { describe, expect, it } from "vitest";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";
import { routing } from "@/i18n/routing";

type MessageValue = string | MessageValue[] | { [key: string]: MessageValue };
type MessageTree = { [key: string]: MessageValue };

const catalogs: Record<string, MessageTree> = { en, tr, de, fa };

/** Flattens to `a.b.c` → string; array items are keyed by index (`a.list.0`). */
function flatten(tree: MessageValue, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof tree === "string") {
    out.set(prefix, tree);
    return out;
  }
  for (const [key, value] of Object.entries(tree)) {
    for (const [k, v] of flatten(value, prefix ? `${prefix}.${key}` : key)) out.set(k, v);
  }
  return out;
}

/** ICU argument names (`{count}`, `{count, plural, …}`) a message interpolates. */
function icuArguments(message: string): string[] {
  const names = new Set<string>();
  for (const match of message.matchAll(/\{\s*([A-Za-z_][\w]*)\s*[,}]/g)) names.add(match[1]);
  return [...names].sort();
}

describe("message catalogs", () => {
  const reference = flatten(en);

  it("covers every routed locale", () => {
    expect(Object.keys(catalogs).sort()).toEqual([...routing.locales].sort());
  });

  for (const locale of routing.locales.filter((l) => l !== "en")) {
    describe(locale, () => {
      const flat = flatten(catalogs[locale]);

      it("has exactly the same keys as en", () => {
        const missing = [...reference.keys()].filter((k) => !flat.has(k));
        const extra = [...flat.keys()].filter((k) => !reference.has(k));
        expect({ missing, extra }).toEqual({ missing: [], extra: [] });
      });

      it("has no empty values", () => {
        const empty = [...flat].filter(([, v]) => v.trim() === "").map(([k]) => k);
        expect(empty).toEqual([]);
      });

      it("interpolates the same ICU arguments as en", () => {
        const mismatched = [...reference]
          .filter(([key, value]) => {
            const translated = flat.get(key);
            return (
              translated !== undefined &&
              icuArguments(value).join() !== icuArguments(translated).join()
            );
          })
          .map(([key]) => key);
        expect(mismatched).toEqual([]);
      });
    });
  }
});
