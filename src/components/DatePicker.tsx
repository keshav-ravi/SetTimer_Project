"use client";

// The date control (Req 2): previous day, the date (tap to open the phone's
// own date picker), next day. Future dates are not allowed.
import { addDays, formatWorkoutDate } from "@/lib/sets/dates";

export default function DatePicker({
  date,
  today,
  onChange,
}: {
  date: string; // the chosen day, YYYY-MM-DD
  today: string; // the user's today, YYYY-MM-DD
  onChange: (next: string) => void;
}) {
  const arrow =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-black/5 text-2xl font-semibold disabled:opacity-30 dark:bg-white/10";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous day"
        onClick={() => onChange(addDays(date, -1))}
        className={arrow}
      >
        ‹
      </button>

      {/* The real date input sits invisibly on top of the label, so tapping
          the label opens the phone's native date picker. */}
      <label className="relative flex h-12 flex-1 items-center justify-center rounded-lg border border-black/20 text-base font-semibold dark:border-white/30">
        {formatWorkoutDate(date, today)}
        <input
          type="date"
          aria-label="Choose date"
          value={date}
          max={today}
          onChange={(event) => {
            // The box can be cleared, which gives an empty string: ignore that.
            if (event.target.value) onChange(event.target.value);
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      <button
        type="button"
        aria-label="Next day"
        onClick={() => onChange(addDays(date, 1))}
        disabled={date >= today}
        className={arrow}
      >
        ›
      </button>
    </div>
  );
}
