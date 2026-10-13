"use server";

// Adding and renaming the user's own exercises (Req 8). They run on the
// server, check the user is signed in, validate the name again (never trust
// the browser), and use the user's own Supabase connection so Row Level
// Security applies: nobody can see or change anybody else's exercises.

import type { ActionResult } from "@/app/sets/actions";
import { describeExerciseError } from "@/lib/sets/exerciseErrors";
import {
  MAX_CUSTOM_EXERCISES,
  cleanExerciseName,
  findDuplicate,
  validateExerciseName,
} from "@/lib/sets/exerciseName";
import { isUuid } from "@/lib/sets/edit";
import {
  getExercises,
  insertCustomExercise,
  updateExerciseName,
  type ExerciseOption,
} from "@/lib/sets/queries";
import { createClient } from "@/lib/supabase/server";

const NOT_SIGNED_IN = "You are signed out. Please sign in again.";

// Adds a custom exercise. If an exercise with that name already exists (a
// preset or one of the user's own), nothing is created and that existing one
// is returned instead, so the user simply ends up with it selected.
export async function createExercise(
  rawName: string,
): Promise<
  ActionResult<{
    exercise: ExerciseOption;
    exercises: ExerciseOption[];
    existed: boolean;
  }>
> {
  const problem = validateExerciseName(rawName);
  if (problem) return { ok: false, error: problem };
  const name = cleanExerciseName(rawName);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: NOT_SIGNED_IN };

  try {
    const exercises = await getExercises(supabase);
    const existing = findDuplicate(name, exercises);
    if (existing)
      return { ok: true, exercise: existing, exercises, existed: true };

    if (exercises.filter((e) => e.isCustom).length >= MAX_CUSTOM_EXERCISES) {
      return {
        ok: false,
        error: `You can have up to ${MAX_CUSTOM_EXERCISES} of your own exercises.`,
      };
    }

    const exercise = await insertCustomExercise(supabase, auth.user.id, name);
    return {
      ok: true,
      exercise,
      exercises: await getExercises(supabase),
      existed: false,
    };
  } catch (error) {
    console.error("createExercise failed", error);
    return { ok: false, error: describeExerciseError(error) };
  }
}

// Renames one of the user's own exercises (a typo fix). Presets cannot be
// renamed. Every logged set that uses it shows the new name.
export async function renameExercise(input: {
  exerciseId: string;
  name: string;
}): Promise<ActionResult<{ exercises: ExerciseOption[] }>> {
  if (!isUuid(input.exerciseId)) {
    return { ok: false, error: "That exercise no longer exists.", gone: true };
  }
  const problem = validateExerciseName(input.name);
  if (problem) return { ok: false, error: problem };
  const name = cleanExerciseName(input.name);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: NOT_SIGNED_IN };

  try {
    const exercises = await getExercises(supabase);
    const target = exercises.find((e) => e.id === input.exerciseId);
    if (!target) {
      return {
        ok: false,
        error: "That exercise no longer exists.",
        gone: true,
      };
    }
    if (!target.isCustom) {
      return { ok: false, error: "Only your own exercises can be renamed." };
    }
    // Another exercise already has this name (renaming to the same name with
    // different capitals is fine, since only the OTHER exercises are checked).
    const clash = findDuplicate(
      name,
      exercises.filter((e) => e.id !== input.exerciseId),
    );
    if (clash) {
      return {
        ok: false,
        error: clash.isCustom
          ? "You already have an exercise with that name."
          : "That name is already used by a built-in exercise.",
      };
    }

    const updated = await updateExerciseName(supabase, input.exerciseId, name);
    if (!updated) {
      return {
        ok: false,
        error: "That exercise no longer exists.",
        gone: true,
      };
    }
    return { ok: true, exercises: await getExercises(supabase) };
  } catch (error) {
    console.error("renameExercise failed", error);
    return { ok: false, error: describeExerciseError(error) };
  }
}
