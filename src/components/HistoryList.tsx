"use client";

// The History list (Req 6): past workouts, newest first. Tapping one opens
// that day on the logging screen. "Show more" loads older workouts.
import Link from "next/link";
import { useState } from "react";
import { loadHistory } from "@/app/sets/actions";
import { formatWorkoutDate, localDateString } from "@/lib/sets/dates";
import { formatDaySummary, type HistoryDay } from "@/lib/sets/history";

export default function HistoryList({
  initialDays,
  initialHasMore,
}: {
  initialDays: HistoryDay[];
  initialHasMore: boolean;
}) {
  const [days, setDays] = useState(initialDays);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function showMore() {
    const oldest = days[days.length - 1]?.date;
    if (!oldest) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loadHistory(oldest);
      if (!result.ok) {
        setError(result.error);
      } else {
        setDays((current) => [...current, ...result.days]);
        setHasMore(result.hasMore);
      }
    } catch {
      setError("No connection. Check your signal and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (days.length === 0) {
    return (
      <p className="text-sm opacity-70">
        No workouts yet. Log a set and it will show up here.
      </p>
    );
  }

  // "Today" and "Yesterday" depend on the user's own calendar day.
  const today = localDateString(new Date());

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {days.map((day) => (
          <li key={day.date}>
            <Link
              href={`/?date=${day.date}`}
              className="flex min-h-16 flex-col justify-center rounded-lg bg-black/5 p-3 dark:bg-white/10"
            >
              <span className="text-base font-semibold">
                {formatWorkoutDate(day.date, today)}
              </span>
              <span className="text-sm opacity-80">
                {formatDaySummary(day)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={showMore}
          disabled={loading}
          className="h-12 rounded-lg bg-black/5 text-base font-semibold disabled:opacity-60 dark:bg-white/10"
        >
          {loading ? "Loading..." : "Show more"}
        </button>
      )}
    </div>
  );
}
