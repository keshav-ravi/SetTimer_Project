import Link from "next/link";
import HistoryList from "@/components/HistoryList";
import { getHistory } from "@/lib/sets/queries";
import { createClient } from "@/lib/supabase/server";

// Lists past workouts. The first page is loaded on the server; "Show more"
// (inside HistoryList) loads older ones. Row Level Security means the query
// can only ever return the signed-in user's own workouts.
export default async function HistoryPage() {
  const supabase = await createClient();
  const { days, hasMore } = await getHistory(supabase);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-5 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <Link
          href="/"
          className="flex min-h-11 items-center font-medium underline"
        >
          Back to logging
        </Link>
      </header>

      <HistoryList initialDays={days} initialHasMore={hasMore} />
    </main>
  );
}
