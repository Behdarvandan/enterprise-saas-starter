#!/usr/bin/env bash
set -euo pipefail
# This project has no local Supabase dev stack (no supabase/config.toml,
# no local Postgres via Docker) — it works exclusively against the remote
# project via `supabase link` (see CLAUDE.md). Generate from that linked
# project, not `--local`, which requires `supabase start`.
# Write to a temp file first so a failed/short CLI run (e.g. an error JSON
# blob printed to stdout) never truncates the committed types file.
tmp_file="src/types/database.ts.tmp"
npx supabase gen types typescript --linked > "$tmp_file"
mv "$tmp_file" src/types/database.ts

# NOTE: the CLI's raw output types `document_chunks.embedding` /
# `match_document_chunks.query_embedding` as plain `string` and the
# `create_pending_appointment` RPC's optional text args (p_customer_phone,
# p_device_info, p_issue_description) as non-nullable `string` — both wrong
# for how src/lib/rag and src/lib/booking.ts actually call them (raw
# `number[]` embeddings, `?? null` args). After running this script, re-run
# `npx tsc --noEmit`; if it fails on those call sites, reapply the narrower
# manual type overrides (`string | number[]` / `string | null`) that were
# there before regenerating, rather than editing the call sites.
