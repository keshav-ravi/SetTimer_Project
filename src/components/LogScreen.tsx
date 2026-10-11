"use client";

// The main logging screen: pick an exercise, enter reps and weight, tap
// "Log set". The timer is added in a later slice; this slice only saves sets.
import { useEffect, useState } from "react";
import TodaySets from "@/components/TodaySets";
import { deleteLastSet, loadTodayState, logSet } from "@/app/sets/actions";
import { track } from "@/lib/analytics";
import { defaultsForExercise } from "@/lib/sets/defaults";
import { localDateString } from "@/lib/sets/dates";
import { formatSet, latestSet, type SetRow } from "@/lib/sets/group";
import type { ExerciseOption } from "@/lib/sets/queries";
import {
  REPS_STEP,
  WEIGHT_STEP,
  stepValue,
} from "@/lib/sets/steppers";
import {
  REPS_MAX,
  REPS_MIN,
  WEIGHT_MAX,
  WEIGHT_MIN,
  parseSetInput,
} from "@/lib/sets/validation";

// A number box with - and + buttons (both at least 44px tall for thumbs).
function Stepper({
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

export default function LogScreen() {
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [exerciseId, setExerciseId] = useState("");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(
    null,
  );

  // Load exercises and today's sets once. The date is computed here, in the
  // browser, so "today" is the user's own day, not the server's (UTC).
  useEffect(() => {
    let cancelled = false;
    loadTodayState(localDateString(new Date())).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setMessage({ text: result.error, isError: true });
        setLoaded(true);
        return;
      }
      const { exercises, sets, lastUsedExerciseId } = result.state;
      // Preselect the exercise used most recently (a brand-new user gets the
      // first one in the list).
      const initial = lastUsedExerciseId ?? exercises[0]?.id ?? "";
      const defaults = defaultsForExercise(initial, sets);
      setExercises(exercises);
      setSets(sets);
      setExerciseId(initial);
      setReps(defaults.reps);
      setWeight(defaults.weight);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleExerciseChange(nextId: string) {
    setExerciseId(nextId);
    const defaults = defaultsForExercise(nextId, sets);
    setReps(defaults.reps);
    setWeight(defaults.weight);
    setMessage(null);
  }

  async function handleLogSet() {
    const parsed = parseSetInput(reps, weight);
    if (!parsed.ok) {
      setMessage({ text: parsed.error, isError: true });
      return;
    }
    setBusy(true); // also blocks a double-tap from saving the set twice
    const result = await logSet({
      exerciseId,
      reps,
      weight,
      localDate: localDateString(new Date()),
    });
    setBusy(false);
    if (!result.ok) {
      setMessage({ text: result.error, isError: true });
      return;
    }
    setSets(result.sets);
    // Analytics: user id only, no workout details.
    track("set_logged");
    if (result.startedWorkout) track("workout_started");
    const count = result.sets.filter((s) => s.exerciseId === exerciseId).length;
    setMessage({ text: `Set ${count} logged.`, isError: false });
  }

  async function handleDeleteLast() {
    const last = latestSet(sets);
    if (!last) return;
    if (!window.confirm(`Delete your last set (${last.exerciseName}, ${formatSet(last)})?`)) {
      return;
    }
    setBusy(true);
    const result = await deleteLastSet(localDateString(new Date()));
    setBusy(false);
    if (!result.ok) {
      setMessage({ text: result.error, isError: true });
      return;
    }
    setSets(result.sets);
    setMessage({ text: "Last set deleted.", isError: false });
  }

  if (!loaded) {
    return <p className="p-6 text-sm opacity-70">Loading...</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Exercise
          <select
            value={exerciseId}
            onChange={(event) => handleExerciseChange(event.target.value)}
            className="h-14 rounded-lg border border-black/20 bg-transparent px-3 text-lg dark:border-white/30"
          >
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>

        <Stepper
          label="Weight"
          unit="lb"
          value={weight}
          onChange={setWeight}
          step={WEIGHT_STEP}
          min={WEIGHT_MIN}
          max={WEIGHT_MAX}
          inputMode="decimal"
        />
        <Stepper
          label="Reps"
          value={reps}
          onChange={setReps}
          step={REPS_STEP}
          min={REPS_MIN}
          max={REPS_MAX}
          inputMode="numeric"
        />

        {/* aria-live announces the result to screen readers */}
        <p
          aria-live="polite"
          role={message?.isError ? "alert" : undefined}
          className={`min-h-5 text-sm font-medium ${
            message?.isError ? "text-red-600" : "text-green-700 dark:text-green-400"
          }`}
        >
          {message?.text}
        </p>

        <TodaySets sets={sets} onDeleteLast={handleDeleteLast} busy={busy} />
      </div>

      {/* Primary action pinned to the bottom, reachable with one thumb. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/20">
        <button
          type="button"
          onClick={handleLogSet}
          disabled={busy || !exerciseId}
          className="mx-auto block h-16 w-full max-w-sm rounded-xl bg-foreground text-xl font-bold text-background disabled:opacity-60"
        >
          {busy ? "Saving..." : "Log set"}
        </button>
      </div>
    </>
  );
}
