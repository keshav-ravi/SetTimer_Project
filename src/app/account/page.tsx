import Link from "next/link";
import DeleteAccount from "@/components/DeleteAccount";
import { emailToUsername } from "@/lib/auth/username";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const username = emailToUsername(user?.email) ?? "unknown";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Account</h1>
        <Link
          href="/"
          className="flex min-h-11 items-center font-medium underline"
        >
          Back to logging
        </Link>
      </header>

      <p className="text-base">
        Signed in as <strong>{username}</strong>
      </p>

      <Link
        href="/privacy"
        className="flex min-h-12 items-center rounded-lg bg-black/5 px-3 text-base font-medium dark:bg-white/10"
      >
        Privacy note
      </Link>

      <DeleteAccount />
    </main>
  );
}
