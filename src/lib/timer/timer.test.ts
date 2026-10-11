import { describe, expect, it } from "vitest";
import {
  IDLE,
  DEFAULT_REST_SECONDS,
  MAX_REST_SECONDS,
  MIN_REST_SECONDS,
  getRemainingMs,
  logSet,
  stop,
  tick,
  type TimerState,
} from "./timer";

const NOW = 1_000_000;
// A fixed length for the rule tests below. The rules work for any length.
const REST_SECONDS = 90;
const REST_MS = REST_SECONDS * 1000;

describe("rest length limits", () => {
  it("defaults to 90 seconds", () => {
    expect(DEFAULT_REST_SECONDS).toBe(90);
  });

  it("allows 15 seconds to 10 minutes, and the default is inside that range", () => {
    expect(MIN_REST_SECONDS).toBe(15);
    expect(MAX_REST_SECONDS).toBe(600);
    expect(DEFAULT_REST_SECONDS).toBeGreaterThanOrEqual(MIN_REST_SECONDS);
    expect(DEFAULT_REST_SECONDS).toBeLessThanOrEqual(MAX_REST_SECONDS);
  });
});

describe("logSet", () => {
  it("while idle: starts running with end = now + the chosen rest length", () => {
    expect(logSet(NOW, REST_SECONDS)).toEqual({
      status: "running",
      endTime: NOW + REST_MS,
    });
  });

  it("while running: resets end = now + the chosen rest length", () => {
    // logSet ignores the previous state, so a running timer is simply
    // overwritten with a fresh end time measured from the new "now".
    const later = NOW + 5_000;
    expect(logSet(later, REST_SECONDS)).toEqual({
      status: "running",
      endTime: later + REST_MS,
    });
  });

  it("uses whatever rest length it is given (Req 7)", () => {
    expect(logSet(NOW, 60)).toEqual({
      status: "running",
      endTime: NOW + 60_000,
    });
    expect(logSet(NOW, 120)).toEqual({
      status: "running",
      endTime: NOW + 120_000,
    });
    expect(logSet(NOW, MIN_REST_SECONDS)).toEqual({
      status: "running",
      endTime: NOW + MIN_REST_SECONDS * 1000,
    });
    expect(logSet(NOW, MAX_REST_SECONDS)).toEqual({
      status: "running",
      endTime: NOW + MAX_REST_SECONDS * 1000,
    });
  });

  it("a new length applies from the next start or reset, never to a running timer", () => {
    const running = logSet(NOW, 90);
    // Changing the setting later does not touch `running`...
    expect(running).toEqual({ status: "running", endTime: NOW + 90_000 });
    // ...it only matters the next time logSet is called.
    const reset = logSet(NOW + 10_000, 180);
    expect(reset).toEqual({
      status: "running",
      endTime: NOW + 10_000 + 180_000,
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
    // Halfway through, so the test works for any REST_SECONDS value.
    expect(getRemainingMs(running, NOW + REST_MS / 2)).toBe(REST_MS / 2);
  });

  it("never goes negative after the end time", () => {
    const running: TimerState = { status: "running", endTime: NOW + REST_MS };
    expect(getRemainingMs(running, NOW + REST_MS + 5_000)).toBe(0);
  });
});
