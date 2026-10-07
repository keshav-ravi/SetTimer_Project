import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { emailToUsername } from "@/lib/auth/username";
import { createClient } from "@/lib/supabase/server";

// Placeholder home screen. Slice 2 replaces this with exercise + set logging.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const username = emailToUsername(user?.email) ?? "unknown";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">SetTimer</h1>
        <p className="mt-1 text-base">
          Signed in as <strong>{username}</strong>
        </p>
      </div>
      <p className="text-sm opacity-70">
        Set logging is coming next. For now you can try the timer spike.
      </p>
      <Link
        href="/spike"
        className="flex min-h-12 items-center justify-center rounded-lg bg-black/5 text-base font-medium dark:bg-white/10"
      >
        Open timer spike
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="min-h-12 w-full rounded-lg bg-foreground text-base font-semibold text-background"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
