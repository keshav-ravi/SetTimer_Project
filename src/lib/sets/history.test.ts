import { describe, expect, it } from "vitest";
import { formatDaySummary, summarizeDay } from "./history";

const set = (exerciseName: string, time: string) => ({
  exerciseName,
  createdAt: `2026-01-01T12:${time}:00.000Z`,
});

describe("summarizeDay", () => {
  it("counts sets and lists each exercise once, in the order first done", () => {
    const day = summarizeDay("2026-01-01", [
      set("Pull-Up", "20"),
      set("Bench Press", "00"),
      set("Bench Press", "10"),
    ]);
    expect(day).toEqual({
      date: "2026-01-01",
      setCount: 3,
      exerciseNames: ["Bench Press", "Pull-Up"],
    });
  });

  it("handles a day with no sets", () => {
    expect(summarizeDay("2026-01-01", [])).toEqual({
      date: "2026-01-01",
      setCount: 0,
      exerciseNames: [],
    });
  });
});

describe("formatDaySummary", () => {
  it("joins exercise names and shows the set count", () => {
    expect(
      formatDaySummary({ date: "d", setCount: 5, exerciseNames: ["Bench Press", "Pull-Up"] }),
    ).toBe("Bench Press, Pull-Up · 5 sets");
  });

  it("uses the singular for one set", () => {
    expect(formatDaySummary({ date: "d", setCount: 1, exerciseNames: ["Dip"] })).toBe("Dip · 1 set");
  });

  it("shortens long lists to three names plus a count", () => {
    expect(
      formatDaySummary({
        date: "d",
        setCount: 12,
        exerciseNames: ["A", "B", "C", "D", "E"],
      }),
    ).toBe("A, B, C +2 more · 12 sets");
  });

  it("does not add 'more' for exactly three exercises", () => {
    expect(
      formatDaySummary({ date: "d", setCount: 6, exerciseNames: ["A", "B", "C"] }),
    ).toBe("A, B, C · 6 sets");
  });
});
