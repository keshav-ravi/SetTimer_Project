import { describe, expect, it } from "vitest";
import {
  deltaSeconds,
  formatLogAsTsv,
  markAlerted,
  markEnded,
  startRun,
} from "./runLog";

const START = Date.parse("2026-01-01T12:00:00.000Z");
const END = START + 90_000;

describe("startRun", () => {
  it("creates a pending entry with no alert time", () => {
    expect(startRun(1, START, END)).toEqual({
      id: 1,
      startedAt: START,
      expectedEnd: END,
      outcome: "pending",
    });
  });
});

describe("markAlerted / markEnded", () => {
  it("records the alert time and outcome without mutating the original", () => {
    const entry = startRun(1, START, END);
    const alerted = markAlerted(entry, END + 500);
    expect(alerted.outcome).toBe("alerted");
    expect(alerted.alertFiredAt).toBe(END + 500);
    expect(entry.outcome).toBe("pending");
  });

  it("marks reset and stopped runs with no alert time", () => {
    const entry = startRun(1, START, END);
    expect(markEnded(entry, "reset")).toMatchObject({ outcome: "reset" });
    expect(markEnded(entry, "stopped").alertFiredAt).toBeUndefined();
  });
});

describe("deltaSeconds", () => {
  it("is null when no alert fired", () => {
    expect(deltaSeconds(startRun(1, START, END))).toBeNull();
  });

  it("is 0 when the alert fires exactly on time", () => {
    expect(deltaSeconds(markAlerted(startRun(1, START, END), END))).toBe(0);
  });

  it("is positive when late, rounded to 1 decimal", () => {
    expect(deltaSeconds(markAlerted(startRun(1, START, END), END + 1_240))).toBe(
      1.2,
    );
  });

  it("is negative when early", () => {
    expect(deltaSeconds(markAlerted(startRun(1, START, END), END - 2_000))).toBe(
      -2,
    );
  });
});

describe("formatLogAsTsv", () => {
  it("outputs a header plus one tab-separated row per entry", () => {
    const alerted = markAlerted(startRun(1, START, END), END + 1_000);
    const reset = markEnded(startRun(2, START, END), "reset");
    const lines = formatLogAsTsv([alerted, reset]).split("\n");
    expect(lines[0]).toBe("started\texpected_end\talert_fired\tdelta_s\toutcome");
    expect(lines[1]).toBe(
      "2026-01-01T12:00:00.000Z\t2026-01-01T12:01:30.000Z\t2026-01-01T12:01:31.000Z\t1\talerted",
    );
    // Reset run: alert time and delta columns are empty.
    expect(lines[2]).toBe(
      "2026-01-01T12:00:00.000Z\t2026-01-01T12:01:30.000Z\t\t\treset",
    );
  });
});
