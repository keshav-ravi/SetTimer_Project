import { describe, expect, it } from "vitest";
import { isValidDateString, localDateString } from "./dates";

describe("localDateString", () => {
  it("formats using the local calendar date with zero padding", () => {
    // new Date(y, m, d, h) builds a LOCAL time, so this works in any time zone.
    expect(localDateString(new Date(2026, 0, 5, 21, 30))).toBe("2026-01-05");
    expect(localDateString(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });

  it("uses the local day late in the evening (not the UTC day)", () => {
    expect(localDateString(new Date(2026, 5, 15, 23, 45))).toBe("2026-06-15");
  });
});

describe("isValidDateString", () => {
  it("accepts real dates", () => {
    expect(isValidDateString("2026-10-11")).toBe(true);
    expect(isValidDateString("2028-02-29")).toBe(true); // leap year
  });

  it("rejects impossible dates and wrong formats", () => {
    expect(isValidDateString("2026-02-31")).toBe(false);
    expect(isValidDateString("2027-02-29")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("2026-1-5")).toBe(false);
    expect(isValidDateString("10/11/2026")).toBe(false);
    expect(isValidDateString("")).toBe(false);
  });
});
