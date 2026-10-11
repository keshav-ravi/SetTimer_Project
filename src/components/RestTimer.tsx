"use client";

// The rest timer bar, shown just above the Log set button. Display only: all
// the logic is in useRestTimer, and the rules are in timer.ts.
import { formatRemaining } from "@/lib/timer/format";
import { REST_SECONDS, type TimerState } from "@/lib/timer/timer";

export default function RestTimer({
  timer,
  remainingMs,
  restOver,
  onStop,
}: {
  timer: TimerState;
  remainingMs: number;
  restOver: boolean;
  onStop: () => void;
}) {
  if (timer.status === "running") {
    return (
      <div className="mx-auto mb-3 flex w-full max-w-sm items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">
            Rest
          </p>
          {/* tabular-nums keeps the digits the same width so the text doesn't jiggle */}
          <p className="text-4xl font-bold tabular-nums" aria-label={`${formatRemaining(remainingMs)} remaining`}>
            {formatRemaining(remainingMs)}
          </p>
        </div>
        <button
          type="button"
          onClick={onStop}
          className="h-12 min-w-24 rounded-lg bg-black/10 px-4 text-base font-semibold dark:bg-white/15"
        >
          Stop
        </button>
      </div>
    );
  }

  // Idle: either the rest just ended, or nothing has been logged yet.
  return (
    <p
      role="status"
      className="mx-auto mb-3 w-full max-w-sm text-center text-sm font-medium opacity-80"
    >
      {restOver
        ? "Rest over. Ready for your next set."
        : `Timer starts when you log a set (${formatRemaining(REST_SECONDS * 1000)}).`}
    </p>
  );
}
