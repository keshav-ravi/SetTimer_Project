"use client";

// The rest timer bar, shown just above the Log set button. Display only: all
// the logic is in useRestTimer, and the rules are in timer.ts.
import { formatRemaining } from "@/lib/timer/format";
import { formatRestLength } from "@/lib/settings/restDuration";
import type { TimerState } from "@/lib/timer/timer";

export default function RestTimer({
  timer,
  remainingMs,
  restOver,
  pushIssue,
  restSeconds,
  onOpenRestLength,
  onStop,
}: {
  timer: TimerState;
  remainingMs: number;
  restOver: boolean;
  pushIssue: string | null;
  // The user's chosen rest length (Req 7) and a way to open the picker.
  restSeconds: number;
  onOpenRestLength: () => void;
  onStop: () => void;
}) {
  if (timer.status === "running") {
    return (
      <>
        <div className="mx-auto mb-3 flex w-full max-w-sm items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">
              Rest
            </p>
            {/* tabular-nums keeps the digits the same width so the text doesn't jiggle */}
            <p
              className="text-4xl font-bold tabular-nums text-accent"
              aria-label={`${formatRemaining(remainingMs)} remaining`}
            >
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
        {pushIssue && (
          <p className="mx-auto mb-3 w-full max-w-sm text-xs opacity-70">
            Lock-screen alert could not be scheduled ({pushIssue}). You will
            still get alerts with the app open.
          </p>
        )}
      </>
    );
  }

  // Idle: either the rest just ended, or nothing has been logged yet. The
  // button shows the chosen rest length and opens the picker.
  return (
    <div className="mx-auto mb-3 flex w-full max-w-sm items-center justify-between gap-3">
      <p role="status" className="text-sm font-medium opacity-80">
        {restOver
          ? "Rest over. Ready for your next set."
          : "Timer starts when you log a set."}
      </p>
      <button
        type="button"
        onClick={onOpenRestLength}
        aria-label={`Rest length ${formatRestLength(restSeconds)}. Tap to change.`}
        className="min-h-11 shrink-0 rounded-lg bg-black/5 px-3 text-sm font-semibold dark:bg-white/10"
      >
        Rest: {formatRestLength(restSeconds)} ›
      </button>
    </div>
  );
}
