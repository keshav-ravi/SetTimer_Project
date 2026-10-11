// Pure timer rules. No React, no browser APIs, no Date.now() calls:
// every function receives `now` (milliseconds since 1970) as an argument,
// so behavior is predictable and easy to unit test.

// The rest length a user gets until they choose another (Req 7). This is the
// ONE place the default is defined. The user's own choice is passed into
// logSet below, so the rules never assume 90.
export const DEFAULT_REST_SECONDS = 90;

// The shortest and longest rest a user may choose. The database and the push
// scheduling window use the same limits.
export const MIN_REST_SECONDS = 15;
export const MAX_REST_SECONDS = 600; // 10 minutes

// A "discriminated union": the `status` field tells TypeScript which
// other fields exist. Think of it like a tagged variant in Python.
export type TimerState =
  { status: "idle" } | { status: "running"; endTime: number };

export const IDLE: TimerState = { status: "idle" };

// Log set: always (re)starts the countdown from now, whether the timer
// was idle (start) or running (reset). `durationSeconds` is the user's chosen
// rest length; it only takes effect at the moment of a start or reset, so a
// timer that is already running is never changed by a new setting.
export function logSet(now: number, durationSeconds: number): TimerState {
  return { status: "running", endTime: now + durationSeconds * 1000 };
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
