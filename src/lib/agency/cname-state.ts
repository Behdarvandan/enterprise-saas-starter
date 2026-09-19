import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface CnameCheckState {
  lastCheckedAt: string | null;
  /** CNAME targets seen at the last check. */
  records: string[];
}

const EMPTY: CnameCheckState = { lastCheckedAt: null, records: [] };

/**
 * The persisted result of the last DNS check (see
 * 20261123000000_agency_cname_check_state.sql). Degrades to "never checked"
 * when the columns don't exist yet — i.e. before that migration is applied —
 * so the branding page keeps working either way.
 */
export async function getCnameCheckState(
  supabase: SupabaseClient<Database>,
  agencyId: string,
): Promise<CnameCheckState> {
  const { data, error } = await supabase
    .from("agencies")
    .select("cname_last_checked_at, cname_last_records")
    .eq("id", agencyId)
    .maybeSingle();

  if (error) {
    console.warn("CNAME check state unavailable (has the migration been applied?):", error.message);
    return EMPTY;
  }
  return {
    lastCheckedAt: data?.cname_last_checked_at ?? null,
    records: data?.cname_last_records ?? [],
  };
}
