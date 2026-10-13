import { describe, expect, it } from "vitest";
import {
  MAX_CUSTOM_EXERCISES,
  MAX_EXERCISE_NAME_LENGTH,
  cleanExerciseName,
  findDuplicate,
  validateExerciseName,
} from "./exerciseName";

describe("limits", () => {
  it("are 40 characters and 50 exercises", () => {
    expect(MAX_EXERCISE_NAME_LENGTH).toBe(40);
    expect(MAX_CUSTOM_EXERCISES).toBe(50);
  });
});

describe("cleanExerciseName", () => {
  it("trims and collapses runs of spaces", () => {
    expect(cleanExerciseName("  Cable   Crunch ")).toBe("Cable Crunch");
    expect(cleanExerciseName("Hip\tThrust\n(heavy)")).toBe(
      "Hip Thrust (heavy)",
    );
    expect(cleanExerciseName("   ")).toBe("");
  });

  it("keeps capitals exactly as typed", () => {
    expect(cleanExerciseName("RDL with Pause")).toBe("RDL with Pause");
  });
});

describe("validateExerciseName", () => {
  it("accepts ordinary names", () => {
    for (const name of [
      "Cable Crunch",
      "Farmer's Walk",
      "Farmer’s Walk",
      "Landmine Press (single arm)",
      "Hack Squat - narrow stance",
      "Pull-Up, weighted",
      "Curl & Press",
      "Sled push/pull",
      "Pressé",
      "ベンチプレス",
      "21s",
    ]) {
      expect(validateExerciseName(name)).toBeNull();
    }
  });

  it("rejects an empty or blank name", () => {
    expect(validateExerciseName("")).toMatch(/Enter a name/);
    expect(validateExerciseName("    ")).toMatch(/Enter a name/);
  });

  it("allows exactly 40 characters but not 41", () => {
    expect(validateExerciseName("a".repeat(40))).toBeNull();
    expect(validateExerciseName("a".repeat(41))).toMatch(/40 characters/);
  });

  it("counts the cleaned length (extra spaces do not count)", () => {
    expect(validateExerciseName("a".repeat(40) + "     ")).toBeNull();
  });

  it("rejects symbols that are not allowed", () => {
    for (const name of [
      "Bench <script>",
      "Squat 💪",
      "Row #1",
      "Curl; DROP",
      "a@b",
      "50% curl",
      "x=y",
    ]) {
      expect(validateExerciseName(name)).toMatch(/letters, numbers/);
    }
  });

  it("needs at least one letter or number", () => {
    for (const name of ["---", "( )", "..."]) {
      expect(validateExerciseName(name)).toMatch(
        /at least one letter or number/,
      );
    }
  });
});

describe("findDuplicate", () => {
  const list = [
    { id: "1", name: "Bench Press" },
    { id: "2", name: "Chin-Up" },
    { id: "3", name: "Cable Crunch" },
  ];

  it("finds a match whatever the capitals", () => {
    expect(findDuplicate("bench press", list)?.id).toBe("1");
    expect(findDuplicate("BENCH PRESS", list)?.id).toBe("1");
  });

  it("ignores punctuation and spacing differences", () => {
    expect(findDuplicate("chin up", list)?.id).toBe("2");
    expect(findDuplicate("Chin  Up", list)?.id).toBe("2");
    expect(findDuplicate("bench-press", list)?.id).toBe("1");
  });

  it("returns null when there is no match, or the name is empty", () => {
    expect(findDuplicate("Incline Bench Press", list)).toBeNull();
    expect(findDuplicate("", list)).toBeNull();
    expect(findDuplicate("---", list)).toBeNull();
  });

  it("does not treat a longer name as a duplicate", () => {
    expect(findDuplicate("Bench", list)).toBeNull();
  });
});
