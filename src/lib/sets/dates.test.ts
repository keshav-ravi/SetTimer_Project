import { describe, expect, it } from "vitest";
import {
  addDays,
  formatWorkoutDate,
  isAllowedWorkoutDate,
  isValidDateString,
  localDateString,
} from "./dates";

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

describe("addDays", () => {
  it("moves forward and backward, across months and years", () => {
    expect(addDays("2026-10-11", 1)).toBe("2026-10-12");
    expect(addDays("2026-10-11", -1)).toBe("2026-10-10");
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("handles leap days", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
  });

  it("handles larger steps", () => {
    expect(addDays("2026-10-11", 30)).toBe("2026-11-10");
    expect(addDays("2026-10-11", 0)).toBe("2026-10-11");
  });
});

describe("formatWorkoutDate", () => {
  const today = "2026-10-11"; // a Sunday

  it("says Today and Yesterday", () => {
    expect(formatWorkoutDate("2026-10-11", today)).toBe("Today");
    expect(formatWorkoutDate("2026-10-10", today)).toBe("Yesterday");
  });

  it("shows weekday, month and day otherwise", () => {
    expect(formatWorkoutDate("2026-10-08", today)).toBe("Thu, Oct 8");
    expect(formatWorkoutDate("2026-01-05", today)).toBe("Mon, Jan 5");
  });

  it("adds the year for other years", () => {
    expect(formatWorkoutDate("2025-12-20", today)).toBe("Sat, Dec 20, 2025");
  });

  it("calls the day before New Year's Day Yesterday even across years", () => {
    expect(formatWorkoutDate("2025-12-31", "2026-01-01")).toBe("Yesterday");
  });
});

describe("isAllowedWorkoutDate", () => {
  // 2026-10-11 12:00 UTC
  const now = Date.UTC(2026, 9, 11, 12, 0, 0);

  it("accepts today, past dates and tomorrow-in-UTC (for users ahead of UTC)", () => {
    expect(isAllowedWorkoutDate("2026-10-11", now)).toBe(true);
    expect(isAllowedWorkoutDate("2026-01-01", now)).toBe(true);
    expect(isAllowedWorkoutDate("2026-10-12", now)).toBe(true);
  });

  it("rejects dates further in the future", () => {
    expect(isAllowedWorkoutDate("2026-10-13", now)).toBe(false);
    expect(isAllowedWorkoutDate("2030-01-01", now)).toBe(false);
  });

  it("rejects absurdly old dates and invalid ones", () => {
    expect(isAllowedWorkoutDate("1999-12-31", now)).toBe(false);
    expect(isAllowedWorkoutDate("2026-02-31", now)).toBe(false);
    expect(isAllowedWorkoutDate("not-a-date", now)).toBe(false);
  });
});
