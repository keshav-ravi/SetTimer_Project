// Pure rules for searching the exercise list (Req 13). No React, no network.

// Lower-case, strip accents, and turn every run of punctuation or spaces into
// a single space: "Chin-Up" and "chin up" both become "chin up".
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents: "pressé" -> "presse"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// How well an exercise matches (smaller is better), or null for no match.
//   0: the name starts with what was typed        ("ben" -> "Bench Press")
//   1: every typed word starts a word in the name ("dumb press" -> "Dumbbell Shoulder Press")
//   2: every typed word appears somewhere inside  ("ench" -> "Bench Press")
function matchRank(
  name: string,
  query: string,
  tokens: string[],
): number | null {
  const normalized = normalizeForSearch(name);
  const compact = normalized.replace(/ /g, ""); // lets "chinup" find "Chin-Up"
  const found = (token: string) =>
    normalized.includes(token) || compact.includes(token);
  if (!tokens.every(found)) return null;

  if (normalized.startsWith(query)) return 0;
  const words = normalized.split(" ");
  const startsWords = tokens.every((token) =>
    words.some((word) => word.startsWith(token)),
  );
  return startsWords ? 1 : 2;
}

// Returns the exercises that match the search, best matches first (ties keep
// the original, alphabetical order). An empty search returns everything.
// The input list is never changed.
export function filterExercises<T extends { id: string; name: string }>(
  exercises: T[],
  search: string,
): T[] {
  const query = normalizeForSearch(search);
  if (query === "") return [...exercises];
  const tokens = query.split(" ");

  return exercises
    .map((exercise, index) => ({
      exercise,
      index,
      rank: matchRank(exercise.name, query, tokens),
    }))
    .filter(
      (entry): entry is typeof entry & { rank: number } => entry.rank !== null,
    )
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.exercise);
}
