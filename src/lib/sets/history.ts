// Pure helpers for the History page. No React, no network.

export type HistorySetInput = { exerciseName: string; createdAt: string };

export type HistoryDay = {
  date: string; // YYYY-MM-DD
  setCount: number;
  exerciseNames: string[]; // each exercise once, in the order first done
};

// Builds one History row from a day's sets.
export function summarizeDay(
  date: string,
  sets: HistorySetInput[],
): HistoryDay {
  const ordered = [...sets].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const names: string[] = [];
  for (const set of ordered) {
    if (!names.includes(set.exerciseName)) names.push(set.exerciseName);
  }
  return { date, setCount: sets.length, exerciseNames: names };
}

const MAX_NAMES_SHOWN = 3;

// "Bench Press, Pull-Up · 5 sets". With many exercises: "A, B, C +2 more · 12 sets".
export function formatDaySummary(day: HistoryDay): string {
  const shown = day.exerciseNames.slice(0, MAX_NAMES_SHOWN).join(", ");
  const extra = day.exerciseNames.length - MAX_NAMES_SHOWN;
  const names = extra > 0 ? `${shown} +${extra} more` : shown;
  const sets = `${day.setCount} ${day.setCount === 1 ? "set" : "sets"}`;
  return names ? `${names} · ${sets}` : sets;
}
