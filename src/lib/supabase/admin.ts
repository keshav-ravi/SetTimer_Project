// Supabase connection with ADMIN powers (the service-role key). It can do
// anything, bypassing Row Level Security, so it is only for server code that
// has already checked who the user is (see src/app/account/actions.ts).
// The key has no NEXT_PUBLIC_ prefix, so Next.js never sends it to the browser.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  // Belt and braces: never allow this to run in the browser.
  if (typeof window !== "undefined") {
    throw new Error("The admin client must never run in the browser.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin credentials are not configured.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
