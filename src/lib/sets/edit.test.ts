import { describe, expect, it } from "vitest";
import { canSave, draftFromSet, isUuid, validateEdit } from "./edit";
import type { SetRow } from "./group";

const BENCH = "11111111-1111-4111-8111-111111111111";
const SQUAT = "22222222-2222-4222-8222-222222222222";

const set: SetRow = {
  id: "33333333-3333-4333-8333-333333333333",
  exerciseId: BENCH,
  exerciseName: "Bench Press",
  reps: 8,
  weightLb: 135,
  createdAt: "2026-10-11T12:00:00.000Z",
};

describe("isUuid", () => {
  it("accepts UUIDs and rejects everything else", () => {
    expect(isUuid(BENCH)).toBe(true);
    for (const v of [
      "",
      "abc",
      "1234",
      "../etc/passwd",
      null,
      undefined,
      5,
      {},
    ]) {
      expect(isUuid(v)).toBe(false);
    }
  });
});

describe("draftFromSet", () => {
  it("fills the draft with the set's current values as text", () => {
    expect(draftFromSet(set)).toEqual({
      exerciseId: BENCH,
      reps: "8",
      weight: "135",
    });
  });

  it("keeps a zero weight and decimals", () => {
    expect(draftFromSet({ ...set, weightLb: 0 }).weight).toBe("0");
    expect(draftFromSet({ ...set, weightLb: 132.5 }).weight).toBe("132.5");
  });
});

describe("validateEdit", () => {
  it("accepts a valid draft and turns text into numbers", () => {
    expect(
      validateEdit({ exerciseId: SQUAT, reps: "10", weight: "225" }),
    ).toEqual({
      ok: true,
      value: { exerciseId: SQUAT, reps: 10, weightLb: 225 },
    });
  });

  it("uses the same limits as logging a set", () => {
    for (const draft of [
      { exerciseId: BENCH, reps: "0", weight: "135" },
      { exerciseId: BENCH, reps: "1000", weight: "135" },
      { exerciseId: BENCH, reps: "8", weight: "-5" },
      { exerciseId: BENCH, reps: "8", weight: "2001" },
      { exerciseId: BENCH, reps: "", weight: "135" },
      { exerciseId: BENCH, reps: "8", weight: "" },
      { exerciseId: BENCH, reps: "8.5", weight: "135" },
    ]) {
      expect(validateEdit(draft)).toMatchObject({ ok: false });
    }
  });

  it("rejects a missing or malformed exercise", () => {
    for (const exerciseId of ["", "bench", "123", "not-a-uuid"]) {
      expect(
        validateEdit({ exerciseId, reps: "8", weight: "135" }),
      ).toMatchObject({
        ok: false,
      });
    }
  });

  it("allows bodyweight (0)", () => {
    expect(
      validateEdit({ exerciseId: BENCH, reps: "12", weight: "0" }),
    ).toMatchObject({
      ok: true,
    });
  });
});

describe("canSave", () => {
  it("is false when nothing changed", () => {
    expect(canSave(set, draftFromSet(set))).toBe(false);
  });

  it("treats the same number typed differently as no change", () => {
    expect(
      canSave(set, { exerciseId: BENCH, reps: "8", weight: "135.0" }),
    ).toBe(false);
    expect(
      canSave(set, { exerciseId: BENCH, reps: " 8 ", weight: "135" }),
    ).toBe(false);
  });

  it("is true when reps, weight or exercise change", () => {
    expect(canSave(set, { exerciseId: BENCH, reps: "9", weight: "135" })).toBe(
      true,
    );
    expect(canSave(set, { exerciseId: BENCH, reps: "8", weight: "140" })).toBe(
      true,
    );
    expect(canSave(set, { exerciseId: SQUAT, reps: "8", weight: "135" })).toBe(
      true,
    );
  });

  it("is false for a change that is not valid", () => {
    expect(canSave(set, { exerciseId: BENCH, reps: "0", weight: "135" })).toBe(
      false,
    );
    expect(canSave(set, { exerciseId: BENCH, reps: "8", weight: "" })).toBe(
      false,
    );
  });
});
