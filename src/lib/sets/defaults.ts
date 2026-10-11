// What the reps/weight boxes start with after choosing an exercise.
// Rule (agreed for P0): copy the most recent set logged TODAY for that same
// exercise. Otherwise reps start at 10 and weight is blank. We deliberately do
// NOT look at earlier sessions: "prefill from last session" is a later (P2)
// feature.

import type { SetRow } from "./group";

export const DEFAULT_REPS = 10;

export type FormDefaults = {
  reps: string; // text, because they go straight into the text boxes
  weight: string;
};

export function defaultsForExercise(
  exerciseId: string,
  todaysSets: SetRow[],
): FormDefaults {
  let latest: SetRow | null = null;
  for (const s of todaysSets) {
    if (s.exerciseId === exerciseId && (!latest || s.createdAt > latest.createdAt)) {
      latest = s;
    }
  }
  if (latest) return { reps: String(latest.reps), weight: String(latest.weightLb) };
  return { reps: String(DEFAULT_REPS), weight: "" };
}
