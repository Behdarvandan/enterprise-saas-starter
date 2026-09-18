// ============================================================================
// Pasargad — Demo knowledge-base seed
// ----------------------------------------------------------------------------
// Ingests a few canned FAQ/service documents into the "Repair Shop Demo"
// organization (supabase/seed-repair-shop-demo.sql) so the landing page's
// interactive playground (HeroPlayground.tsx -> ChatWidget) has real content
// to answer from. Content matches that seed's actual services/hours so the
// demo answers are internally consistent.
//
// This is NOT a migration and does not go through /api/rag/ingest (which
// requires authenticated org membership, unusable for a one-time operator
// seed). It calls the Gemini embeddings API directly with the service-role
// key, mirroring the same chunk/embed pipeline pasargad-core's Ops Crew uses
// (packages/graph/nodes/ops.py::_embed_query) so seeded and query-time
// embeddings come from the same model/dimensionality.
//
// Requires GOOGLE_API_KEY (or GEMINI_API_KEY), NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY to be set. Run once, against a project where
// supabase/seed-repair-shop-demo.sql has already been applied:
//
//   node --env-file=.env.local scripts/seed-demo-knowledge-base.mjs
//
// Safe to re-run: it deletes any documents/chunks it previously created for
// this org (matched by title) before re-inserting.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const DEMO_ORGANIZATION_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 1536;

const DOCUMENTS = [
  {
    title: "Hours & Booking",
    content:
      "Repair Shop Demo is open Monday through Friday, 9:00 AM to 5:00 PM. " +
      "You can book an appointment any time through our online booking page — " +
      "just pick a service, choose an available time slot, and confirm. Most " +
      "repairs can be booked same-week, and walk-ins are welcome during open " +
      "hours if a technician is free.",
  },
  {
    title: "Services & Pricing",
    content:
      "We offer: Phone Screen Replacement ($89, ~45 minutes) — cracked or " +
      "unresponsive screen replacement for most phone models. Laptop " +
      "Diagnostic ($29, ~30 minutes) — full hardware and software diagnostic " +
      "to identify the root cause of an issue. Battery Replacement ($49, ~30 " +
      "minutes) — replace a degraded phone or laptop battery with a new, " +
      "genuine-spec one. Data Recovery Consultation (free, ~20 minutes) — " +
      "assessment of recoverable data from a damaged or failing drive. Water " +
      "Damage Assessment ($39, ~30 minutes) — inspection and cleaning " +
      "assessment for a liquid-damaged device.",
  },
  {
    title: "Device Status & Repair Process",
    content:
      "Every device we take in gets logged with a status: received, " +
      "diagnosing, awaiting parts, repairing, or ready for pickup. You can " +
      "ask us for your device's current status at any time and we'll check " +
      "it for you. Most screen and battery replacements are same-day. Water " +
      "damage and data recovery cases usually take 2-4 business days " +
      "depending on parts availability. We'll always call or message you " +
      "before doing any repair that costs more than the original estimate.",
  },
];

function chunkText(text, maxChunkSize = 1000, overlap = 200) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  if (normalized.length <= maxChunkSize) {
    return [{ index: 0, content: normalized, tokenCount: Math.ceil(normalized.length / 4) }];
  }

  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + maxChunkSize, normalized.length);
    if (end < normalized.length) {
      const lastSpace = normalized.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }
    const content = normalized.slice(start, end).trim();
    if (content) {
      chunks.push({ index: chunks.length, content, tokenCount: Math.ceil(content.length / 4) });
    }
    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

async function getEmbedding(apiKey, text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        output_dimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Embedding request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const embedding = data?.embedding?.values ?? data?.embeddings?.[0]?.values;
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Unexpected embedding response from Gemini: ${JSON.stringify(data)}`);
  }
  return embedding;
}

async function main() {
  const geminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!geminiKey || !supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing GOOGLE_API_KEY (or GEMINI_API_KEY), NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", DEMO_ORGANIZATION_ID)
    .maybeSingle();

  if (orgError) throw orgError;
  if (!org) {
    console.error(
      `Demo organization ${DEMO_ORGANIZATION_ID} not found — run supabase/seed-repair-shop-demo.sql first.`,
    );
    process.exit(1);
  }

  for (const doc of DOCUMENTS) {
    // Re-runnable: clear any previous ingestion of this same doc title for
    // this org before inserting fresh (document_chunks cascades on delete).
    await supabase
      .from("documents")
      .delete()
      .eq("organization_id", DEMO_ORGANIZATION_ID)
      .eq("title", doc.title);

    const { data: inserted, error: insertError } = await supabase
      .from("documents")
      .insert({
        organization_id: DEMO_ORGANIZATION_ID,
        title: doc.title,
        source_type: "text",
        content: doc.content,
        status: "processing",
        byte_size: new TextEncoder().encode(doc.content).length,
      })
      .select("id")
      .single();

    if (insertError || !inserted) throw insertError ?? new Error("Insert failed.");

    const chunks = chunkText(doc.content);
    const rows = [];
    for (const chunk of chunks) {
      const embedding = await getEmbedding(geminiKey, chunk.content);
      rows.push({
        organization_id: DEMO_ORGANIZATION_ID,
        document_id: inserted.id,
        chunk_index: chunk.index,
        content: chunk.content,
        token_count: chunk.tokenCount,
        embedding,
      });
    }

    const { error: chunkError } = await supabase.from("document_chunks").insert(rows);
    if (chunkError) throw chunkError;

    await supabase.from("documents").update({ status: "ready" }).eq("id", inserted.id);

    console.log(`Ingested "${doc.title}" (${rows.length} chunk${rows.length === 1 ? "" : "s"}).`);
  }

  console.log("Demo knowledge base seeded.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
