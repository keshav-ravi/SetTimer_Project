// Supabase connection for server code (pages, server actions, API routes).
// It reads and writes the login cookies, so it acts as the signed-in user,
// and Row Level Security applies to everything it does.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies. That's fine: src/proxy.ts
            // refreshes the login cookies on every page request.
          }
        },
      },
    },
  );
}
