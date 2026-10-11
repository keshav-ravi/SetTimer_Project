import { describe, expect, it } from "vitest";
import { formatRemaining } from "./format";

describe("formatRemaining", () => {
  it("formats whole seconds as m:ss", () => {
    expect(formatRemaining(90_000)).toBe("1:30");
    expect(formatRemaining(60_000)).toBe("1:00");
    expect(formatRemaining(61_000)).toBe("1:01");
    expect(formatRemaining(9_000)).toBe("0:09");
  });

  it("rounds partial seconds up", () => {
    expect(formatRemaining(89_001)).toBe("1:30");
    expect(formatRemaining(1)).toBe("0:01");
    expect(formatRemaining(1_001)).toBe("0:02");
  });

  it("shows 0:00 at zero and never goes negative", () => {
    expect(formatRemaining(0)).toBe("0:00");
    expect(formatRemaining(-5_000)).toBe("0:00");
  });
});
