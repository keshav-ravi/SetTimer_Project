import { describe, expect, it } from "vitest";
import { parseSetInput } from "./validation";

describe("parseSetInput", () => {
  it("accepts normal values from text boxes", () => {
    expect(parseSetInput("8", "135")).toEqual({
      ok: true,
      value: { reps: 8, weightLb: 135 },
    });
  });

  it("accepts numbers too, and decimal weights like 132.5", () => {
    expect(parseSetInput(10, 132.5)).toEqual({
      ok: true,
      value: { reps: 10, weightLb: 132.5 },
    });
  });

  it("allows 0 weight for bodyweight exercises", () => {
    expect(parseSetInput("12", "0")).toEqual({
      ok: true,
      value: { reps: 12, weightLb: 0 },
    });
  });

  it("rounds weight to 2 decimals", () => {
    expect(parseSetInput("5", "100.456")).toEqual({
      ok: true,
      value: { reps: 5, weightLb: 100.46 },
    });
  });

  it("trims spaces", () => {
    expect(parseSetInput(" 8 ", " 135 ").ok).toBe(true);
  });

  it("rejects empty boxes (not treated as 0)", () => {
    expect(parseSetInput("", "135")).toMatchObject({ ok: false });
    expect(parseSetInput("8", "")).toMatchObject({ ok: false });
    expect(parseSetInput("  ", "135")).toMatchObject({ ok: false });
  });

  it("rejects reps that are zero, negative, fractional, huge or not numbers", () => {
    for (const reps of ["0", "-3", "2.5", "1000", "abc"]) {
      expect(parseSetInput(reps, "100")).toMatchObject({ ok: false });
    }
  });

  it("rejects weights that are negative, over the limit, or not numbers", () => {
    for (const weight of ["-5", "2001", "heavy", "Infinity", "NaN"]) {
      expect(parseSetInput("5", weight)).toMatchObject({ ok: false });
    }
  });

  it("accepts the boundary values", () => {
    expect(parseSetInput("1", "0").ok).toBe(true);
    expect(parseSetInput("999", "2000").ok).toBe(true);
  });
});
