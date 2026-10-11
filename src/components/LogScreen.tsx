"use client";

// The main logging screen: pick an exercise, enter reps and weight, tap
// "Log set". The date control chooses which day the sets belong to.
import { useCallback, useEffect, useRef, useState } from "react";
import DatePicker from "@/components/DatePicker";
import DaySets from "@/components/DaySets";
import RestTimer from "@/components/RestTimer";
import SetupFlow from "@/components/SetupFlow";
import { deleteLastSet, loadDayState, logSet } from "@/app/sets/actions";
import { track } from "@/lib/analytics";
import { defaultsForExercise } from "@/lib/sets/defaults";
import { formatWorkoutDate, localDateString } from "@/lib/sets/dates";
import { formatSet, latestSet, type SetRow } from "@/lib/sets/group";
import { useRestTimer } from "@/lib/timer/useRestTimer";
import type { ExerciseOption } from "@/lib/sets/queries";
import { REPS_STEP, WEIGHT_STEP, stepValue } from "@/lib/sets/steppers";
import {
  REPS_MAX,
  REPS_MIN,
  WEIGHT_MAX,
  WEIGHT_MIN,
  parseSetInput,
} from "@/lib/sets/validation";

// Shown when a request fails outright (for example no signal at the gym).
const NETWORK_ERROR = "No connection. Check your signal and try again.";

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

export default function LogScreen({
  initialDate,
}: {
  // A date from the History page (?date=...), or null for today.
  initialDate: string | null;
}) {
  const restTimer = useRestTimer();
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [exerciseId, setExerciseId] = useState("");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("");
  // The day being viewed/logged. The date is computed here, in the browser, so
  // "today" is the user's own day, not the server's (UTC).
  const [date, setDate] = useState(() => {
    const todayLocal = localDateString(new Date());
    // A date from the URL is ignored if it is in the future.
    return initialDate && initialDate <= todayLocal ? initialDate : todayLocal;
  });
  const [today, setToday] = useState(() => localDateString(new Date()));
  const [loaded, setLoaded] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  // The newest request wins: if the user taps through days quickly, an older,
  // slower response must not overwrite a newer one.
  const latestRequest = useRef(0);
  // The exercise currently selected, readable inside loadDay without making
  // loadDay depend on it.
  const exerciseIdRef = useRef("");
  const firstDate = useRef(date);

  // Loads one day: the exercise list, that day's sets, and the exercise to
  // preselect. Used on first load and whenever the date changes.
  const loadDay = useCallback(async (target: string) => {
    const request = ++latestRequest.current;
    const result = await loadDayState(target).catch(() => ({
      ok: false as const,
      error: NETWORK_ERROR,
    }));
    if (request !== latestRequest.current) return; // a newer request replaced this one
    setToday(localDateString(new Date()));
    setDayLoading(false);
    setLoaded(true);
    if (!result.ok) {
      setMessage({ text: result.error, isError: true });
      return;
    }
    const { exercises, sets, lastUsedExerciseId } = result.state;
    // Keep the exercise the user already picked; on first load, preselect the
    // one used most recently (a brand-new user gets the first in the list).
    const chosen =
      exerciseIdRef.current || (lastUsedExerciseId ?? exercises[0]?.id ?? "");
    const defaults = defaultsForExercise(chosen, sets);
    exerciseIdRef.current = chosen;
    setExercises(exercises);
    setSets(sets);
    setExerciseId(chosen);
    setReps(defaults.reps);
    setWeight(defaults.weight);
  }, []);

  useEffect(() => {
    void loadDay(firstDate.current);
  }, [loadDay]);

  // Called by the date control. Future dates are not allowed.
  function handleDateChange(next: string) {
    if (next === date || next > localDateString(new Date())) return;
    setDate(next);
    setSets([]);
    setDayLoading(true);
    setMessage(null);
    void loadDay(next);
  }

  function handleExerciseChange(nextId: string) {
    setExerciseId(nextId);
    exerciseIdRef.current = nextId;
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
    // The rest timer only runs for today's sets: catching up on a past day
    // should not buzz the phone 90 seconds later. (Req 5a)
    const startsTimer = date === localDateString(new Date());
    // Start it right away, on the tap, without waiting for the network (gym
    // reception can be slow). If the save fails we stop it below.
    if (startsTimer) restTimer.start();
    let result: Awaited<ReturnType<typeof logSet>>;
    try {
      result = await logSet({
        exerciseId,
        reps,
        weight,
        localDate: date,
      });
    } catch {
      // The request itself failed (no signal, server unreachable).
      result = { ok: false, error: NETWORK_ERROR };
    } finally {
      setBusy(false); // always re-enable the buttons, even after an error
    }
    if (!result.ok) {
      if (startsTimer) restTimer.cancel(); // the set was not saved, so no rest timer
      setMessage({
        text: startsTimer
          ? `${result.error} The rest timer was stopped.`
          : result.error,
        isError: true,
      });
      return;
    }
    setSets(result.sets);
    // Analytics: user id only, no workout details.
    track("set_logged");
    if (result.startedWorkout) track("workout_started");
    const count = result.sets.filter((s) => s.exerciseId === exerciseId).length;
    const where = startsTimer ? "" : ` for ${formatWorkoutDate(date, today)}`;
    setMessage({ text: `Set ${count} logged${where}.`, isError: false });
  }

  async function handleDeleteLast() {
    const last = latestSet(sets);
    if (!last) return;
    if (
      !window.confirm(
        `Delete your last set (${last.exerciseName}, ${formatSet(last)})?`,
      )
    ) {
      return;
    }
    setBusy(true);
    let result: Awaited<ReturnType<typeof deleteLastSet>>;
    try {
      result = await deleteLastSet(date);
    } catch {
      result = { ok: false, error: NETWORK_ERROR };
    } finally {
      setBusy(false);
    }
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
        <DatePicker date={date} today={today} onChange={handleDateChange} />

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
            message?.isError
              ? "text-red-600"
              : "text-green-700 dark:text-green-400"
          }`}
        >
          {message?.text}
        </p>

        <SetupFlow />

        <DaySets
          title={formatWorkoutDate(date, today)}
          sets={sets}
          loading={dayLoading}
          onDeleteLast={handleDeleteLast}
          busy={busy}
        />
      </div>

      {/* Timer and primary action pinned to the bottom, reachable with one thumb. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/20">
        <RestTimer
          timer={restTimer.timer}
          remainingMs={restTimer.remainingMs}
          restOver={restTimer.restOver}
          pushIssue={restTimer.pushIssue}
          onStop={restTimer.stop}
        />
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
