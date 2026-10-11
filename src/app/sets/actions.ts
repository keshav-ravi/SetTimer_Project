"use server";

// Server actions for the logging screen. They run on the server, check that
// the user is signed in, validate input again (never trust the browser), and
// use the user's own Supabase connection so Row Level Security applies.

import { isAllowedWorkoutDate } from "@/lib/sets/dates";
import { isUuid, validateEdit } from "@/lib/sets/edit";
import type { SetRow } from "@/lib/sets/group";
import { latestSet } from "@/lib/sets/group";
import {
  deleteSetInWorkout,
  deleteWorkoutIfEmpty,
  getExercises,
  getHistory,
  getLastUsedExerciseId,
  getSetsForWorkout,
  getWorkoutId,
  updateSetInWorkout,
  type ExerciseOption,
} from "@/lib/sets/queries";
import type { HistoryDay } from "@/lib/sets/history";
import { getRestSeconds } from "@/lib/settings/queries";
import { parseSetInput } from "@/lib/sets/validation";
import { createClient } from "@/lib/supabase/server";

export type DayState = {
  exercises: ExerciseOption[];
  sets: SetRow[];
  lastUsedExerciseId: string | null;
  // The user's saved rest length, or null if none (or it could not be read).
  restSeconds: number | null;
};

// `gone` is set when the thing being edited no longer exists (for example it
// was deleted on another device), so the screen knows to refresh.
export type ActionResult<T> =
  ({ ok: true } & T) | { ok: false; error: string; gone?: boolean };

const NOT_SIGNED_IN = "You are signed out. Please sign in again.";

// Everything the logging screen needs for the chosen day.
export async function loadDayState(
  localDate: string,
): Promise<ActionResult<{ state: DayState }>> {
  if (!isAllowedWorkoutDate(localDate, Date.now()))
    return { ok: false, error: "Invalid date." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: NOT_SIGNED_IN };

  try {
    const workoutId = await getWorkoutId(supabase, localDate);
    const [exercises, sets, lastUsedExerciseId, restSeconds] =
      await Promise.all([
        getExercises(supabase),
        getSetsForWorkout(supabase, workoutId),
        getLastUsedExerciseId(supabase),
        // Not essential: if the settings can't be read, the app falls back to
        // the copy on the device (or the default) instead of failing.
        getRestSeconds(supabase).catch((error) => {
          console.error("getRestSeconds failed", error);
          return null;
        }),
      ]);
    return {
      ok: true,
      state: { exercises, sets, lastUsedExerciseId, restSeconds },
    };
  } catch (error) {
    console.error("loadDayState failed", error);
    return { ok: false, error: "Could not load your data. Please try again." };
  }
}

export async function logSet(input: {
  exerciseId: string;
  reps: string;
  weight: string;
  localDate: string;
}): Promise<ActionResult<{ sets: SetRow[]; startedWorkout: boolean }>> {
  if (!isAllowedWorkoutDate(input.localDate, Date.now())) {
    return { ok: false, error: "Invalid date." };
  }
  const parsed = parseSetInput(input.reps, input.weight);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: NOT_SIGNED_IN };

  try {
    // Find today's workout, or create it with this first set.
    let workoutId = await getWorkoutId(supabase, input.localDate);
    let startedWorkout = false;
    if (!workoutId) {
      const { data, error } = await supabase
        .from("workouts")
        .insert({ workout_date: input.localDate })
        .select("id")
        .single();
      if (error) {
        // Two taps at once can both try to create the workout; the database
        // allows only one per day, so if we lost the race, use the winner.
        workoutId = await getWorkoutId(supabase, input.localDate);
        if (!workoutId) throw error;
      } else {
        workoutId = (data as { id: string }).id;
        startedWorkout = true;
      }
    }

    const { error: insertError } = await supabase.from("sets").insert({
      workout_id: workoutId,
      exercise_id: input.exerciseId,
      reps: parsed.value.reps,
      weight_lb: parsed.value.weightLb,
    });
    if (insertError) throw insertError;

    const sets = await getSetsForWorkout(supabase, workoutId);
    return { ok: true, sets, startedWorkout };
  } catch (error) {
    console.error("logSet failed", error);
    return { ok: false, error: "Could not save the set. Please try again." };
  }
}

// Req 9a: delete the most recent set from today's workout. If that was the
// last set, the empty workout is removed too so history has no blank days.
// Deleting never touches the rest timer.
export async function deleteLastSet(
  localDate: string,
): Promise<ActionResult<{ sets: SetRow[] }>> {
  if (!isAllowedWorkoutDate(localDate, Date.now()))
    return { ok: false, error: "Invalid date." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: NOT_SIGNED_IN };

  try {
    const workoutId = await getWorkoutId(supabase, localDate);
    const current = await getSetsForWorkout(supabase, workoutId);
    const last = latestSet(current);
    if (!workoutId || !last) return { ok: true, sets: [] };

    const { error } = await supabase.from("sets").delete().eq("id", last.id);
    if (error) throw error;

    await deleteWorkoutIfEmpty(supabase, workoutId);
    const remaining = await getSetsForWorkout(supabase, workoutId);
    return { ok: true, sets: remaining };
  } catch (error) {
    console.error("deleteLastSet failed", error);
    return { ok: false, error: "Could not delete the set. Please try again." };
  }
}

// One page of the History list. `beforeDate` continues from the oldest day
// already shown.
export async function loadHistory(
  beforeDate?: string,
): Promise<ActionResult<{ days: HistoryDay[]; hasMore: boolean }>> {
  if (
    beforeDate !== undefined &&
    !isAllowedWorkoutDate(beforeDate, Date.now())
  ) {
    return { ok: false, error: "Invalid date." };
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: NOT_SIGNED_IN };

  try {
    const { days, hasMore } = await getHistory(supabase, beforeDate);
    return { ok: true, days, hasMore };
  } catch (error) {
    console.error("loadHistory failed", error);
    return {
      ok: false,
      error: "Could not load your history. Please try again.",
    };
  }
}

const SET_GONE = "That set no longer exists.";

// Req 9: change the exercise, weight or reps of any set on the chosen day.
// Editing never touches the rest timer.
export async function updateSet(input: {
  setId: string;
  exerciseId: string;
  reps: string;
  weight: string;
  localDate: string;
}): Promise<ActionResult<{ sets: SetRow[] }>> {
  if (!isAllowedWorkoutDate(input.localDate, Date.now())) {
    return { ok: false, error: "Invalid date." };
  }
  if (!isUuid(input.setId)) return { ok: false, error: SET_GONE, gone: true };
  // Same rules as logging a set; the server never trusts the browser.
  const checked = validateEdit({
    exerciseId: input.exerciseId,
    reps: input.reps,
    weight: input.weight,
  });
  if (!checked.ok) return { ok: false, error: checked.error };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: NOT_SIGNED_IN };

  try {
    const workoutId = await getWorkoutId(supabase, input.localDate);
    if (!workoutId) return { ok: false, error: SET_GONE, gone: true };
    const updated = await updateSetInWorkout(
      supabase,
      workoutId,
      input.setId,
      checked.value,
    );
    if (!updated) return { ok: false, error: SET_GONE, gone: true };
    return { ok: true, sets: await getSetsForWorkout(supabase, workoutId) };
  } catch (error) {
    console.error("updateSet failed", error);
    return { ok: false, error: "Could not save the change. Please try again." };
  }
}

// Req 9: delete any set on the chosen day. If it was the day's last set, the
// empty workout is removed too. Deleting never touches the rest timer.
export async function deleteSet(input: {
  setId: string;
  localDate: string;
}): Promise<ActionResult<{ sets: SetRow[] }>> {
  if (!isAllowedWorkoutDate(input.localDate, Date.now())) {
    return { ok: false, error: "Invalid date." };
  }
  if (!isUuid(input.setId)) return { ok: false, error: SET_GONE, gone: true };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: NOT_SIGNED_IN };

  try {
    const workoutId = await getWorkoutId(supabase, input.localDate);
    if (!workoutId) return { ok: false, error: SET_GONE, gone: true };
    const deleted = await deleteSetInWorkout(supabase, workoutId, input.setId);
    if (!deleted) return { ok: false, error: SET_GONE, gone: true };
    await deleteWorkoutIfEmpty(supabase, workoutId);
    return { ok: true, sets: await getSetsForWorkout(supabase, workoutId) };
  } catch (error) {
    console.error("deleteSet failed", error);
    return { ok: false, error: "Could not delete the set. Please try again." };
  }
}
