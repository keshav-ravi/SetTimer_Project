// Pure helpers for showing today's sets. No React, no network.

export type SetRow = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  reps: number;
  weightLb: number;
  createdAt: string; // ISO timestamp
};

export type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  sets: SetRow[]; // oldest first, so "set 1" is the first one logged
};

// Groups sets by exercise. Groups appear in the order each exercise was first
// done today; inside a group, sets are oldest first.
export function groupSetsByExercise(sets: SetRow[]): ExerciseGroup[] {
  const sorted = [...sets].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const groups = new Map<string, ExerciseGroup>();
  for (const set of sorted) {
    let group = groups.get(set.exerciseId);
    if (!group) {
      group = {
        exerciseId: set.exerciseId,
        exerciseName: set.exerciseName,
        sets: [],
      };
      groups.set(set.exerciseId, group);
    }
    group.sets.push(set);
  }
  return [...groups.values()];
}

// "135 lb x 8", or "bodyweight x 8" when the weight is 0.
export function formatSet(set: Pick<SetRow, "reps" | "weightLb">): string {
  const weight = set.weightLb === 0 ? "bodyweight" : `${set.weightLb} lb`;
  return `${weight} × ${set.reps}`;
}

// The most recently logged set, or null if there are none.
export function latestSet(sets: SetRow[]): SetRow | null {
  if (sets.length === 0) return null;
  return sets.reduce((latest, s) => (s.createdAt > latest.createdAt ? s : latest));
}
