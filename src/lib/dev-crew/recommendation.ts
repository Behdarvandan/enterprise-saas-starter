import { z } from "zod";
import type { CrewInsight, CrewSeverity } from "@/types";

/** Tolerant reader for `audit_logs.metadata`: one bad key never hides the row. */
const metadataSchema = z.object({
  recommendation: z.string().catch(""),
  negative_count: z.number().int().nonnegative().catch(0),
});

export function readCrewMetadata(metadata: unknown): {
  recommendation: string;
  negativeCount: number;
} {
  const parsed = metadataSchema.safeParse(metadata ?? {});
  return parsed.success
    ? { recommendation: parsed.data.recommendation, negativeCount: parsed.data.negative_count }
    : { recommendation: "", negativeCount: 0 };
}

export const CRITICAL_THRESHOLD = 10;
export const WARNING_THRESHOLD = 3;

/** Severity is a UI heuristic over the negative-signal count, not upstream data. */
export function deriveSeverity(negativeCount: number): CrewSeverity {
  if (negativeCount >= CRITICAL_THRESHOLD) return "critical";
  if (negativeCount >= WARNING_THRESHOLD) return "warning";
  return "info";
}

export interface CountedName {
  name: string;
  count: number;
}

export interface ParsedRecommendation {
  /** Structured parts, or null when the text isn't pasargad-core's template. */
  analyzed: number | null;
  actions: CountedName[];
  resources: CountedName[];
  advice: string | null;
  raw: string;
}

const TEMPLATE =
  /^Analyzed (\d+) negative telemetry event\(s\)\. Most frequent actions: (.*?)\. Most affected resources: (.*?)\. Recommendation: (.+)$/s;

function parseCounted(list: string): CountedName[] {
  if (list.trim() === "n/a") return [];
  return list
    .split(/,\s*(?![^(]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = /^(.*?)\s*\(x(\d+)\)$/.exec(part);
      return match ? { name: match[1], count: Number(match[2]) } : { name: part, count: 1 };
    });
}

/** Splits the upstream template into parts; free-form text is returned as `raw` only. */
export function parseRecommendation(text: string): ParsedRecommendation {
  const match = TEMPLATE.exec(text.trim());
  if (!match) return { analyzed: null, actions: [], resources: [], advice: null, raw: text };

  return {
    analyzed: Number(match[1]),
    actions: parseCounted(match[2]),
    resources: parseCounted(match[3]),
    advice: match[4].trim(),
    raw: text,
  };
}

export interface CollapsedInsight extends CrewInsight {
  /** How many consecutive entries carried this same recommendation. */
  repeats: number;
}

/**
 * Collapses runs of consecutive entries with identical text (newest first)
 * into one entry with a repeat count. pasargad-core currently emits a row
 * per chat turn, so without this the feed is dominated by duplicates. The
 * kept entry is the newest of the run; its negative count is the run's max.
 */
export function collapseInsights(insights: readonly CrewInsight[]): CollapsedInsight[] {
  const out: CollapsedInsight[] = [];
  for (const insight of insights) {
    const last = out[out.length - 1];
    if (last && last.recommendation === insight.recommendation) {
      last.repeats += 1;
      last.negativeCount = Math.max(last.negativeCount, insight.negativeCount);
    } else {
      out.push({ ...insight, repeats: 1 });
    }
  }
  return out;
}
