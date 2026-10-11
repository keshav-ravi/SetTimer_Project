"use client";

// The "Rest length" panel (Req 7): five quick choices plus - and + 15 second
// buttons. It sits on top of the app like the install guide: close it with
// Done or Escape. Every change is saved at once (see LogScreen).
import { useEffect, useRef } from "react";
import {
  REST_PRESETS,
  REST_STEP_SECONDS,
  formatRestLength,
  stepRestSeconds,
} from "@/lib/settings/restDuration";
import { MAX_REST_SECONDS, MIN_REST_SECONDS } from "@/lib/timer/timer";

export default function RestLengthPicker({
  seconds,
  onChange,
  onClose,
}: {
  seconds: number;
  onChange: (next: number) => void;
  onClose: () => void;
}) {
  const doneButton = useRef<HTMLButtonElement>(null);

  // Move focus into the panel when it opens, and close on Escape.
  useEffect(() => {
    doneButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stepButton =
    "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-black/5 text-2xl font-semibold disabled:opacity-30 dark:bg-white/10";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rest-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-background p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-sm flex-col gap-5">
        <div>
          <h2 id="rest-title" className="text-2xl font-bold">
            Rest length
          </h2>
          <p className="mt-2 text-base opacity-80">
            Applies to your next set. A timer that is already running is not
            changed.
          </p>
        </div>

        <div
          role="group"
          aria-label="Quick choices"
          className="grid grid-cols-3 gap-2"
        >
          {REST_PRESETS.map((preset) => {
            const selected = preset === seconds;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(preset)}
                className={`h-14 rounded-lg text-lg font-semibold ${
                  selected
                    ? "bg-foreground text-background"
                    : "bg-black/5 dark:bg-white/10"
                }`}
              >
                {formatRestLength(preset)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Shorten rest by ${REST_STEP_SECONDS} seconds`}
            disabled={seconds <= MIN_REST_SECONDS}
            onClick={() =>
              onChange(stepRestSeconds(seconds, -REST_STEP_SECONDS))
            }
            className={stepButton}
          >
            −
          </button>
          <p
            aria-live="polite"
            className="flex h-14 min-w-0 flex-1 items-center justify-center rounded-lg border border-black/20 text-2xl font-bold tabular-nums dark:border-white/30"
          >
            {formatRestLength(seconds)}
          </p>
          <button
            type="button"
            aria-label={`Lengthen rest by ${REST_STEP_SECONDS} seconds`}
            disabled={seconds >= MAX_REST_SECONDS}
            onClick={() =>
              onChange(stepRestSeconds(seconds, REST_STEP_SECONDS))
            }
            className={stepButton}
          >
            +
          </button>
        </div>
        <p className="text-sm opacity-70">
          Choose anything from {formatRestLength(MIN_REST_SECONDS)} to{" "}
          {formatRestLength(MAX_REST_SECONDS)}, in {REST_STEP_SECONDS} second
          steps.
        </p>

        <button
          ref={doneButton}
          type="button"
          onClick={onClose}
          className="h-14 rounded-xl bg-foreground text-lg font-bold text-background"
        >
          Done
        </button>
      </div>
    </div>
  );
}
