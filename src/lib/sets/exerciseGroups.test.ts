import { describe, expect, it } from "vitest";
import { splitExercises } from "./exerciseGroups";

const ex = (name: string, isCustom: boolean) => ({ name, isCustom });

describe("splitExercises", () => {
  it("separates custom exercises from presets and sorts each A to Z", () => {
    const { mine, presets } = splitExercises([
      ex("Squat", false),
      ex("Zercher Squat", true),
      ex("Bench Press", false),
      ex("cable crunch", true),
    ]);
    expect(mine.map((e) => e.name)).toEqual(["cable crunch", "Zercher Squat"]);
    expect(presets.map((e) => e.name)).toEqual(["Bench Press", "Squat"]);
  });

  it("handles no custom exercises, and no exercises at all", () => {
    expect(splitExercises([ex("Squat", false)]).mine).toEqual([]);
    expect(splitExercises([])).toEqual({ mine: [], presets: [] });
  });

  it("does not change the list it was given", () => {
    const list = [ex("B", true), ex("A", true)];
    splitExercises(list);
    expect(list.map((e) => e.name)).toEqual(["B", "A"]);
  });
});
