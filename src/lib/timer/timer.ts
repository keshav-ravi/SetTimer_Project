// Pure timer rules. No React, no browser APIs, no Date.now() calls:
// every function receives `now` (milliseconds since 1970) as an argument,
// so behavior is predictable and easy to unit test.

// The ONE place the rest duration is defined. P1 (adjustable duration)
// will replace this single value.
export const REST_SECONDS = 90;

// A "discriminated union": the `status` field tells TypeScript which
// other fields exist. Think of it like a tagged variant in Python.
export type TimerState =
  | { status: "idle" }
  | { status: "running"; endTime: number };

export const IDLE: TimerState = { status: "idle" };

// Log set: always (re)starts the countdown from now, whether the timer
// was idle (start) or running (reset).
export function logSet(now: number): TimerState {
  return { status: "running", endTime: now + REST_SECONDS * 1000 };
}

// Manual stop: back to idle.
export function stop(): TimerState {
  return IDLE;
}

// We store the end timestamp, never a counter, so remaining time is
// always computed fresh. This stays correct even if the tab was throttled.
export function getRemainingMs(state: TimerState, now: number): number {
  if (state.status === "idle") return 0;
  return Math.max(0, state.endTime - now);
}

// Call this regularly. When the end time has passed it returns idle and
// `expired: true` exactly once (the next call sees idle), so the UI fires
// the alert one time and nothing restarts on its own.
export function tick(
  state: TimerState,
  now: number,
): { state: TimerState; expired: boolean } {
  if (state.status === "running" && now >= state.endTime) {
    return { state: IDLE, expired: true };
  }
  return { state, expired: false };
}
