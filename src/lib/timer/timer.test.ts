import { describe, expect, it } from "vitest";
import {
  IDLE,
  REST_SECONDS,
  getRemainingMs,
  logSet,
  stop,
  tick,
  type TimerState,
} from "./timer";

const NOW = 1_000_000;
const REST_MS = REST_SECONDS * 1000;

describe("REST_SECONDS", () => {
  it("is 90", () => {
    expect(REST_SECONDS).toBe(90);
  });
});

describe("logSet", () => {
  it("while idle: starts running with end = now + REST_SECONDS", () => {
    expect(logSet(NOW)).toEqual({
      status: "running",
      endTime: NOW + REST_MS,
    });
  });

  it("while running: resets end = now + REST_SECONDS", () => {
    // logSet ignores the previous state, so a running timer is simply
    // overwritten with a fresh end time measured from the new "now".
    const later = NOW + 5_000;
    expect(logSet(later)).toEqual({
      status: "running",
      endTime: later + REST_MS,
    });
  });
});

describe("tick", () => {
  const running: TimerState = { status: "running", endTime: NOW + REST_MS };

  it("before the end time: stays running, no alert", () => {
    expect(tick(running, NOW + REST_MS - 1)).toEqual({
      state: running,
      expired: false,
    });
  });

  it("at the end time: alerts once and goes idle", () => {
    expect(tick(running, NOW + REST_MS)).toEqual({
      state: IDLE,
      expired: true,
    });
  });

  it("well past the end time (tab was throttled): still alerts and goes idle", () => {
    expect(tick(running, NOW + REST_MS + 60_000)).toEqual({
      state: IDLE,
      expired: true,
    });
  });

  it("after expiring it stays idle and never restarts or re-alerts", () => {
    const after = tick(running, NOW + REST_MS).state;
    expect(tick(after, NOW + REST_MS + 1000)).toEqual({
      state: IDLE,
      expired: false,
    });
  });

  it("while idle: does nothing", () => {
    expect(tick(IDLE, NOW)).toEqual({ state: IDLE, expired: false });
  });
});

describe("stop", () => {
  it("goes idle (also when called while running)", () => {
    expect(stop()).toEqual(IDLE);
  });

  it("while idle: stays idle", () => {
    expect(stop()).toEqual(IDLE);
  });
});

describe("getRemainingMs (computed from end timestamp, not a counter)", () => {
  it("is 0 when idle", () => {
    expect(getRemainingMs(IDLE, NOW)).toBe(0);
  });

  it("is endTime - now while running", () => {
    const running: TimerState = { status: "running", endTime: NOW + REST_MS };
    expect(getRemainingMs(running, NOW + 30_000)).toBe(REST_MS - 30_000);
  });

  it("never goes negative after the end time", () => {
    const running: TimerState = { status: "running", endTime: NOW + REST_MS };
    expect(getRemainingMs(running, NOW + REST_MS + 5_000)).toBe(0);
  });
});
