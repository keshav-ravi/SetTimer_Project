import { describe, expect, it } from "vitest";
import { describeExerciseError } from "./exerciseErrors";

describe("describeExerciseError", () => {
  it("explains a name that matches a preset", () => {
    expect(
      describeExerciseError({
        code: "P0001",
        message: "EXERCISE_DUPLICATE_PRESET",
      }),
    ).toMatch(/already in the list/);
  });

  it("explains the 50 exercise limit", () => {
    expect(
      describeExerciseError({ code: "P0001", message: "EXERCISE_LIMIT" }),
    ).toMatch(/up to 50/);
  });

  it("explains a duplicate of the user's own exercise", () => {
    expect(
      describeExerciseError({ code: "23505", message: "duplicate key value" }),
    ).toMatch(/already have an exercise/);
  });

  it("explains a name the database rejects", () => {
    expect(
      describeExerciseError({
        code: "23514",
        message: "violates check constraint",
      }),
    ).toMatch(/not allowed/);
  });

  it("falls back to a generic message for anything else", () => {
    for (const error of [
      new Error("boom"),
      { code: "XX000" },
      null,
      undefined,
      "text",
      42,
    ]) {
      expect(describeExerciseError(error)).toBe(
        "Could not save the exercise. Please try again.",
      );
    }
  });
});
