import Link from "next/link";
import { signOut } from "@/app/login/actions";
import LogScreen from "@/components/LogScreen";
import { emailToUsername } from "@/lib/auth/username";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const username = emailToUsername(user?.email) ?? "unknown";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-5 p-4">
      <header>
        <h1 className="text-2xl font-bold">SetTimer</h1>
        <p className="text-sm opacity-70">Signed in as {username}</p>
      </header>

      <LogScreen />

      {/* Kept above the fixed Log set bar by the screen's bottom padding. */}
      <footer className="flex items-center justify-between gap-2 pb-28 text-sm">
        <Link href="/spike" className="flex min-h-11 items-center underline">
          Timer spike
        </Link>
        <form action={signOut}>
          <button type="submit" className="min-h-11 px-3 font-medium underline">
            Sign out
          </button>
        </form>
      </footer>
    </main>
  );
}
