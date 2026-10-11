"use server";

// Deletes the signed-in user's account and everything in it.
//
// Order matters:
//  1. work out who the user is from their login (never from the request body)
//  2. re-check their password, so a stolen unlocked phone can't wipe an account
//  3. cancel their scheduled rest-timer push (best effort)
//  4. delete the user; the database deletes their workouts and sets with them
//  5. sign out

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { parseDeleteRequest } from "@/lib/account/validation";
import { cancelMessage } from "@/lib/push/qstash";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

export async function deleteAccount(input: {
  password: string;
  pushMessageId: string | null;
}): Promise<DeleteAccountResult> {
  const parsed = parseDeleteRequest(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  // 1. Who is asking? Only the signed-in user can delete their own account.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.email)
    return { ok: false, error: "You are signed out. Please sign in again." };

  // 2. Check the password with a separate, cookie-less connection, so this
  // check can't touch or replace the user's current login.
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: passwordError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: parsed.value.password,
  });
  if (passwordError) return { ok: false, error: "Wrong password." };

  // 3. Cancel the pending rest-timer push so no notification arrives later.
  if (parsed.value.pushMessageId) {
    try {
      await cancelMessage(parsed.value.pushMessageId);
    } catch (error) {
      // Not fatal: the push would just be a stray "Rest over" notification.
      console.error("deleteAccount: could not cancel push", error);
    }
  }

  // 4. Delete the user. workouts and sets reference the user with
  // "on delete cascade", so the database removes them too.
  try {
    const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (error) {
    console.error("deleteAccount failed", error);
    return {
      ok: false,
      error: "Could not delete your account. Please try again.",
    };
  }

  // 5. Sign out. The session is already invalid; this clears the cookies.
  try {
    await supabase.auth.signOut();
  } catch {
    // The user is gone either way.
  }
  return { ok: true };
}
