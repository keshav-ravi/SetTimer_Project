import Link from "next/link";
import { signOut } from "@/app/login/actions";
import LogScreen from "@/components/LogScreen";
import { emailToUsername } from "@/lib/auth/username";
import { isValidDateString } from "@/lib/sets/dates";
import { createClient } from "@/lib/supabase/server";

export default async function Home(props: PageProps<"/">) {
  // History links open a specific day as /?date=YYYY-MM-DD.
  const { date } = await props.searchParams;
  const initialDate =
    typeof date === "string" && isValidDateString(date) ? date : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const username = emailToUsername(user?.email) ?? "unknown";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-5 p-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">SetTimer</h1>
          <p className="text-sm opacity-70">Signed in as {username}</p>
        </div>
        <Link
          href="/history"
          className="flex min-h-11 items-center font-medium underline"
        >
          History
        </Link>
      </header>

      <LogScreen initialDate={initialDate} />

      {/* Kept above the fixed Log set bar by the screen's bottom padding. */}
      <footer className="flex items-center justify-between gap-2 pb-44 text-sm">
        <Link
          href="/account"
          className="flex min-h-11 items-center px-1 font-medium underline"
        >
          Account
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
