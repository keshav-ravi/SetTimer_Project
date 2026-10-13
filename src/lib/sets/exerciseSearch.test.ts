import { describe, expect, it } from "vitest";
import { filterExercises, normalizeForSearch } from "./exerciseSearch";

const ex = (name: string) => ({ id: name, name });
const LIST = [
  "Back Squat",
  "Bench Press",
  "Chin-Up",
  "Dumbbell Bench Press",
  "Dumbbell Shoulder Press",
  "Incline Bench Press",
  "Incline Dumbbell Press",
  "Overhead Press",
  "Pull-Up",
].map(ex);
const names = (list: { name: string }[]) => list.map((e) => e.name);

describe("normalizeForSearch", () => {
  it("ignores capitals, punctuation, extra spaces and accents", () => {
    expect(normalizeForSearch("Chin-Up")).toBe("chin up");
    expect(normalizeForSearch("  BENCH   press ")).toBe("bench press");
    expect(normalizeForSearch("Pressé")).toBe("presse");
    expect(normalizeForSearch("Farmer's Walk (heavy)")).toBe(
      "farmer s walk heavy",
    );
    expect(normalizeForSearch("")).toBe("");
  });
});

describe("filterExercises", () => {
  it("returns everything, in the original order, for an empty or blank search", () => {
    expect(names(filterExercises(LIST, ""))).toEqual(names(LIST));
    expect(names(filterExercises(LIST, "   "))).toEqual(names(LIST));
    expect(names(filterExercises(LIST, "---"))).toEqual(names(LIST));
  });

  it("finds exercises whatever the capitals", () => {
    expect(names(filterExercises(LIST, "SQUAT"))).toEqual(["Back Squat"]);
    expect(names(filterExercises(LIST, "squat"))).toEqual(["Back Squat"]);
  });

  it("matches inside names, with names that START with the search first", () => {
    expect(names(filterExercises(LIST, "bench"))).toEqual([
      "Bench Press", // starts with "bench"
      "Dumbbell Bench Press", // "bench" starts a later word
      "Incline Bench Press",
    ]);
  });

  it("needs every typed word to match, in any order", () => {
    expect(names(filterExercises(LIST, "dumbbell press"))).toEqual([
      "Dumbbell Bench Press",
      "Dumbbell Shoulder Press",
      "Incline Dumbbell Press",
    ]);
    expect(names(filterExercises(LIST, "press dumbbell"))).toEqual([
      "Dumbbell Bench Press",
      "Dumbbell Shoulder Press",
      "Incline Dumbbell Press",
    ]);
  });

  it("is forgiving about hyphens and spaces", () => {
    expect(names(filterExercises(LIST, "chin up"))).toEqual(["Chin-Up"]);
    expect(names(filterExercises(LIST, "chinup"))).toEqual(["Chin-Up"]);
    expect(names(filterExercises(LIST, "pull-up"))).toEqual(["Pull-Up"]);
  });

  it("matches the middle of a word, ranked after word-start matches", () => {
    expect(names(filterExercises(LIST, "ench"))).toEqual([
      "Bench Press",
      "Dumbbell Bench Press",
      "Incline Bench Press",
    ]);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterExercises(LIST, "zzz")).toEqual([]);
    expect(filterExercises(LIST, "bench zzz")).toEqual([]);
  });

  it("does not change the list it was given", () => {
    const copy = [...LIST];
    filterExercises(LIST, "press");
    expect(LIST).toEqual(copy);
  });

  it("works with accents in custom exercise names", () => {
    expect(names(filterExercises([ex("Pressé Special")], "presse"))).toEqual([
      "Pressé Special",
    ]);
  });
});
