import { describe, expect, it } from "vitest";
import {
  REST_PRESETS,
  REST_STEP_SECONDS,
  formatRestLength,
  parseRestSeconds,
  restSecondsOrDefault,
  stepRestSeconds,
} from "./restDuration";

describe("parseRestSeconds", () => {
  it("accepts whole numbers from 15 to 600, as numbers or text", () => {
    expect(parseRestSeconds(90)).toBe(90);
    expect(parseRestSeconds("120")).toBe(120);
    expect(parseRestSeconds(" 45 ")).toBe(45);
    expect(parseRestSeconds(15)).toBe(15);
    expect(parseRestSeconds(600)).toBe(600);
  });

  it("rejects values outside the range", () => {
    for (const v of [0, 14, 601, 10_000, -90, "5", "601"]) {
      expect(parseRestSeconds(v)).toBeNull();
    }
  });

  it("rejects fractions, non-numbers, empty and unsafe input", () => {
    for (const v of [
      90.5,
      "90.5",
      "abc",
      "",
      "  ",
      null,
      undefined,
      {},
      [],
      NaN,
      Infinity,
      "9e2",
      "-90",
      "0x5A",
    ]) {
      expect(parseRestSeconds(v)).toBeNull();
    }
  });
});

describe("stepRestSeconds", () => {
  it("moves by the step and respects both limits", () => {
    expect(stepRestSeconds(90, REST_STEP_SECONDS)).toBe(105);
    expect(stepRestSeconds(90, -REST_STEP_SECONDS)).toBe(75);
    expect(stepRestSeconds(20, -REST_STEP_SECONDS)).toBe(15);
    expect(stepRestSeconds(15, -REST_STEP_SECONDS)).toBe(15);
    expect(stepRestSeconds(595, REST_STEP_SECONDS)).toBe(600);
    expect(stepRestSeconds(600, REST_STEP_SECONDS)).toBe(600);
  });
});

describe("presets and labels", () => {
  it("offers 1:00, 1:30, 2:00, 2:30 and 3:00", () => {
    expect(REST_PRESETS.map(formatRestLength)).toEqual([
      "1:00",
      "1:30",
      "2:00",
      "2:30",
      "3:00",
    ]);
  });

  it("every preset is a valid length", () => {
    for (const preset of REST_PRESETS)
      expect(parseRestSeconds(preset)).toBe(preset);
  });

  it("formats lengths as m:ss", () => {
    expect(formatRestLength(45)).toBe("0:45");
    expect(formatRestLength(600)).toBe("10:00");
    expect(formatRestLength(105)).toBe("1:45");
  });
});

describe("restSecondsOrDefault", () => {
  it("uses a valid value and otherwise the fallback", () => {
    expect(restSecondsOrDefault(120, 90)).toBe(120);
    expect(restSecondsOrDefault("150", 90)).toBe(150);
    expect(restSecondsOrDefault(null, 90)).toBe(90);
    expect(restSecondsOrDefault(5, 90)).toBe(90);
    expect(restSecondsOrDefault("junk", 90)).toBe(90);
  });
});
