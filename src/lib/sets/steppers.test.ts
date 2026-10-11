import { describe, expect, it } from "vitest";
import { stepValue } from "./steppers";

describe("stepValue", () => {
  it("adds and subtracts", () => {
    expect(stepValue("135", 5, 0, 2000)).toBe("140");
    expect(stepValue("135", -5, 0, 2000)).toBe("130");
    expect(stepValue("8", 1, 1, 999)).toBe("9");
  });

  it("treats a blank or invalid box as the minimum", () => {
    expect(stepValue("", 5, 0, 2000)).toBe("5");
    expect(stepValue("abc", 5, 0, 2000)).toBe("5");
    expect(stepValue("", 1, 1, 999)).toBe("2");
  });

  it("never goes below the minimum or above the maximum", () => {
    expect(stepValue("2", -5, 0, 2000)).toBe("0");
    expect(stepValue("1", -1, 1, 999)).toBe("1");
    expect(stepValue("999", 1, 1, 999)).toBe("999");
    expect(stepValue("1998", 5, 0, 2000)).toBe("2000");
  });

  it("keeps decimal weights tidy", () => {
    expect(stepValue("132.5", 5, 0, 2000)).toBe("137.5");
    expect(stepValue("0.1", 0.2, 0, 10)).toBe("0.3");
  });
});
