// Turns a database error from adding or renaming an exercise into a short,
// friendly message. Pure, so it can be unit tested with made-up errors.
// (Relative import, not "@/...", so the unit tests can load this file.)

import { MAX_CUSTOM_EXERCISES } from "./exerciseName";

export function describeExerciseError(error: unknown): string {
  const e = (error ?? {}) as { code?: unknown; message?: unknown };
  const message = typeof e.message === "string" ? e.message : "";

  // Raised by the database trigger (migration 0003).
  if (message.includes("EXERCISE_DUPLICATE_PRESET")) {
    return "That exercise is already in the list. Choose it from there.";
  }
  if (message.includes("EXERCISE_LIMIT")) {
    return `You can have up to ${MAX_CUSTOM_EXERCISES} of your own exercises.`;
  }
  // 23505 = unique violation: this user already has one with that name.
  if (e.code === "23505") return "You already have an exercise with that name.";
  // 23514 = check violation: the name broke a database rule.
  if (e.code === "23514") return "That name is not allowed.";
  return "Could not save the exercise. Please try again.";
}
