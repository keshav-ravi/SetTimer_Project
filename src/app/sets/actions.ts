"use server";

// Server actions for the logging screen. They run on the server, check that
// the user is signed in, validate input again (never trust the browser), and
// use the user's own Supabase connection so Row Level Security applies.

import { isValidDateString } from "@/lib/sets/dates";
import type { SetRow } from "@/lib/sets/group";
import { latestSet } from "@/lib/sets/group";
import {
  getExercises,
  getLastUsedExerciseId,
  getSetsForWorkout,
  getWorkoutId,
  type ExerciseOption,
} from "@/lib/sets/queries";
import { parseSetInput } from "@/lib/sets/validation";
import { createClient } from "@/lib/supabase/server";

export type TodayState = {
  exercises: ExerciseOption[];
  sets: SetRow[];
  lastUsedExerciseId: string | null;
};

export type ActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const NOT_SIGNED_IN = "You are signed out. Please sign in again.";

// Everything the logging screen needs for the user's current day.
export async function loadTodayState(
  localDate: string,
): Promise<ActionResult<{ state: TodayState }>> {
  if (!isValidDateString(localDate)) return { ok: false, error: "Invalid date." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: NOT_SIGNED_IN };

  try {
    const workoutId = await getWorkoutId(supabase, localDate);
    const [exercises, sets, lastUsedExerciseId] = await Promise.all([
      getExercises(supabase),
      getSetsForWorkout(supabase, workoutId),
      getLastUsedExerciseId(supabase),
    ]);
    return { ok: true, state: { exercises, sets, lastUsedExerciseId } };
  } catch (error) {
    console.error("loadTodayState failed", error);
    return { ok: false, error: "Could not load your data. Please try again." };
  }
}

export async function logSet(input: {
  exerciseId: string;
  reps: string;
  weight: string;
  localDate: string;
}): Promise<ActionResult<{ sets: SetRow[]; startedWorkout: boolean }>> {
  if (!isValidDateString(input.localDate)) return { ok: false, error: "Invalid date." };
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
  if (!isValidDateString(localDate)) return { ok: false, error: "Invalid date." };
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

    const remaining = await getSetsForWorkout(supabase, workoutId);
    if (remaining.length === 0) {
      const { error: workoutError } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId);
      if (workoutError) throw workoutError;
    }
    return { ok: true, sets: remaining };
  } catch (error) {
    console.error("deleteLastSet failed", error);
    return { ok: false, error: "Could not delete the set. Please try again." };
  }
}
