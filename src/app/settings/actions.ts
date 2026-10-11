"use server";

// Saves the user's chosen rest length (Req 7). It runs on the server, checks
// that the user is signed in, validates the value again (never trust the
// browser), and uses the user's own Supabase connection so Row Level Security
// applies.
import { upsertRestSeconds } from "@/lib/settings/queries";
import { parseRestSeconds } from "@/lib/settings/restDuration";
import { createClient } from "@/lib/supabase/server";

export type SaveRestResult = { ok: true } | { ok: false; error: string };

export async function saveRestSeconds(
  seconds: number,
): Promise<SaveRestResult> {
  const valid = parseRestSeconds(seconds);
  if (valid === null)
    return { ok: false, error: "That rest length is not allowed." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user)
    return { ok: false, error: "You are signed out. Please sign in again." };

  try {
    await upsertRestSeconds(supabase, auth.user.id, valid);
    return { ok: true };
  } catch (error) {
    console.error("saveRestSeconds failed", error);
    return { ok: false, error: "Could not save your rest length." };
  }
}
