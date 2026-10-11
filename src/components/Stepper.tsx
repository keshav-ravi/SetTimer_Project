"use client";

// A number box with - and + buttons (all at least 44px tall for thumbs).
// Used by the logging form and the Edit set panel.
import { stepValue } from "@/lib/sets/steppers";

export default function Stepper({
  label,
  value,
  onChange,
  step,
  min,
  max,
  unit,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  step: number;
  min: number;
  max: number;
  unit?: string;
  inputMode: "numeric" | "decimal";
}) {
  const button =
    "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-black/5 text-2xl font-semibold dark:bg-white/10";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">
        {label}
        {unit ? ` (${unit})` : ""}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(stepValue(value, -step, min, max))}
          className={button}
        >
          −
        </button>
        <input
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode={inputMode}
          className="h-14 min-w-0 flex-1 rounded-lg border border-black/20 bg-transparent px-3 text-center text-2xl font-semibold dark:border-white/30"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(stepValue(value, step, min, max))}
          className={button}
        >
          +
        </button>
      </div>
    </div>
  );
}
