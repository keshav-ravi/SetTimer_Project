import { describe, expect, it } from "vitest";
import { defaultsForExercise } from "./defaults";
import type { SetRow } from "./group";

const set = (id: string, exerciseId: string, time: string, reps: number, weightLb: number): SetRow => ({
  id,
  exerciseId,
  exerciseName: exerciseId,
  reps,
  weightLb,
  createdAt: `2026-01-01T12:${time}:00.000Z`,
});

describe("defaultsForExercise", () => {
  it("starts with 10 reps and a blank weight when nothing was logged today", () => {
    expect(defaultsForExercise("bench", [])).toEqual({ reps: "10", weight: "" });
  });

  it("copies the latest set of the SAME exercise from today", () => {
    const sets = [
      set("1", "bench", "00", 8, 135),
      set("2", "bench", "10", 6, 145),
      set("3", "squat", "20", 5, 225),
    ];
    expect(defaultsForExercise("bench", sets)).toEqual({ reps: "6", weight: "145" });
  });

  it("ignores other exercises", () => {
    const sets = [set("1", "squat", "00", 5, 225)];
    expect(defaultsForExercise("bench", sets)).toEqual({ reps: "10", weight: "" });
  });

  it("keeps a zero weight (bodyweight) rather than blanking it", () => {
    const sets = [set("1", "pullup", "00", 8, 0)];
    expect(defaultsForExercise("pullup", sets)).toEqual({ reps: "8", weight: "0" });
  });
});
