import { describe, expect, it } from "vitest";
import { formatSet, groupSetsByExercise, latestSet, type SetRow } from "./group";

const set = (id: string, exerciseId: string, name: string, time: string, reps = 8, weightLb = 135): SetRow => ({
  id,
  exerciseId,
  exerciseName: name,
  reps,
  weightLb,
  createdAt: `2026-01-01T12:${time}:00.000Z`,
});

describe("groupSetsByExercise", () => {
  it("returns no groups for no sets", () => {
    expect(groupSetsByExercise([])).toEqual([]);
  });

  it("groups by exercise, in the order each was first done", () => {
    const sets = [
      set("1", "bench", "Bench Press", "00"),
      set("2", "squat", "Back Squat", "05"),
      set("3", "bench", "Bench Press", "10"),
    ];
    const groups = groupSetsByExercise(sets);
    expect(groups.map((g) => g.exerciseName)).toEqual(["Bench Press", "Back Squat"]);
    expect(groups[0].sets.map((s) => s.id)).toEqual(["1", "3"]);
  });

  it("sorts sets oldest first even if given out of order", () => {
    const sets = [
      set("late", "bench", "Bench Press", "30"),
      set("early", "bench", "Bench Press", "10"),
    ];
    expect(groupSetsByExercise(sets)[0].sets.map((s) => s.id)).toEqual(["early", "late"]);
  });

  it("does not change the input array", () => {
    const sets = [set("b", "x", "X", "30"), set("a", "x", "X", "10")];
    groupSetsByExercise(sets);
    expect(sets.map((s) => s.id)).toEqual(["b", "a"]);
  });
});

describe("formatSet", () => {
  it("shows weight and reps", () => {
    expect(formatSet({ reps: 8, weightLb: 135 })).toBe("135 lb × 8");
    expect(formatSet({ reps: 10, weightLb: 132.5 })).toBe("132.5 lb × 10");
  });

  it("calls a zero weight bodyweight", () => {
    expect(formatSet({ reps: 12, weightLb: 0 })).toBe("bodyweight × 12");
  });
});

describe("latestSet", () => {
  it("is null when there are no sets", () => {
    expect(latestSet([])).toBeNull();
  });

  it("returns the set with the newest timestamp", () => {
    const sets = [set("a", "x", "X", "10"), set("c", "y", "Y", "40"), set("b", "x", "X", "20")];
    expect(latestSet(sets)?.id).toBe("c");
  });
});
