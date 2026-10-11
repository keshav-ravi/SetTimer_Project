// Server-side reads and writes of the user's settings. They take the
// signed-in user's own Supabase connection, so Row Level Security applies.
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseRestSeconds } from "./restDuration";

// The saved rest length, or null if the user has never changed it (or the
// stored value is somehow not valid).
export async function getRestSeconds(
  supabase: SupabaseClient,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("rest_seconds")
    .maybeSingle();
  if (error) throw new Error("Could not load your settings.");
  return parseRestSeconds(
    (data as { rest_seconds?: unknown } | null)?.rest_seconds,
  );
}

// Saves (creates or updates) the user's rest length.
export async function upsertRestSeconds(
  supabase: SupabaseClient,
  userId: string,
  seconds: number,
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        rest_seconds: seconds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error) throw new Error("Could not save your settings.");
}
