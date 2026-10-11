// Pure rules for the user's chosen rest length (Req 7). No React, no network.
// (Relative imports, not "@/...", so the unit tests can load this file.)

import { formatRemaining } from "../timer/format";
import { MAX_REST_SECONDS, MIN_REST_SECONDS } from "../timer/timer";

// The quick choices shown in the picker.
export const REST_PRESETS = [60, 90, 120, 150, 180] as const;

// How much the + and - buttons change the length.
export const REST_STEP_SECONDS = 15;

// Turns anything we might receive (a number, or text from storage or a
// form) into a valid rest length in seconds, or null if it isn't one.
// Valid means a whole number from the minimum to the maximum.
export function parseRestSeconds(value: unknown): number | null {
  let n: number;
  if (typeof value === "number") {
    n = value;
  } else if (typeof value === "string" && /^\d{1,4}$/.test(value.trim())) {
    n = Number(value.trim());
  } else {
    return null;
  }
  if (!Number.isInteger(n) || n < MIN_REST_SECONDS || n > MAX_REST_SECONDS) {
    return null;
  }
  return n;
}

// The + / - buttons: move by `delta` seconds, staying inside the limits.
export function stepRestSeconds(current: number, delta: number): number {
  return Math.min(
    MAX_REST_SECONDS,
    Math.max(MIN_REST_SECONDS, current + delta),
  );
}

// "1:30", "2:00", "0:45"
export function formatRestLength(seconds: number): string {
  return formatRemaining(seconds * 1000);
}

// What to use when the saved value is missing or not valid.
export function restSecondsOrDefault(value: unknown, fallback: number): number {
  return parseRestSeconds(value) ?? fallback;
}
