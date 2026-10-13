// Pure rules for the names of custom exercises (Req 8). No React, no network.
// (Relative imports, not "@/...", so the unit tests can load this file.)

import { normalizeForSearch } from "./exerciseSearch";

export const MAX_EXERCISE_NAME_LENGTH = 40;
export const MAX_CUSTOM_EXERCISES = 50;

// "  Cable   Crunch " -> "Cable Crunch": trim the ends and make every run of
// spaces (or tabs, line breaks) a single space.
export function cleanExerciseName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

// Letters (any language), numbers, spaces, and a few punctuation marks that
// real exercise names use: - ' ’ ( ) . , & /
const ALLOWED = /^[\p{L}\p{N} '’().,&/-]+$/u;

// Returns an error message to show the user, or null if the name is fine.
// Validate the CLEANED name (see cleanExerciseName).
export function validateExerciseName(raw: string): string | null {
  const name = cleanExerciseName(raw);
  if (name === "") return "Enter a name for the exercise.";
  if (name.length > MAX_EXERCISE_NAME_LENGTH) {
    return `Keep the name to ${MAX_EXERCISE_NAME_LENGTH} characters or fewer.`;
  }
  if (!ALLOWED.test(name)) {
    return "Use letters, numbers, spaces and - ' ( ) & . , / only.";
  }
  if (!/[\p{L}\p{N}]/u.test(name)) {
    return "Include at least one letter or number.";
  }
  return null;
}

// Finds an existing exercise with the same name, ignoring capitals, accents
// and punctuation ("bench-press" matches "Bench Press"). Used to avoid
// creating a duplicate, and to just select the existing one instead.
export function findDuplicate<T extends { id: string; name: string }>(
  name: string,
  existing: T[],
): T | null {
  const wanted = normalizeForSearch(name);
  if (wanted === "") return null;
  return existing.find((e) => normalizeForSearch(e.name) === wanted) ?? null;
}
