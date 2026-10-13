// Splits the exercise list into the user's own exercises and the presets,
// each sorted A to Z. Pure.

export function splitExercises<T extends { name: string; isCustom: boolean }>(
  exercises: T[],
): { mine: T[]; presets: T[] } {
  const byName = (a: T, b: T) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  return {
    mine: exercises.filter((e) => e.isCustom).sort(byName),
    presets: exercises.filter((e) => !e.isCustom).sort(byName),
  };
}
