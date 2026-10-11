// Saves the running timer (and the id of its scheduled push) in localStorage,
// so a reload or the phone discarding the page doesn't lose the countdown or
// forget which push to cancel. Everything read back is checked first, because
// stored data can be old, edited or corrupt.

import { IDLE, type TimerState } from "./timer";

const KEY = "settimer-timer-v1";

export type StoredTimer = {
  timer: TimerState;
  pushMessageId: string | null;
};

const EMPTY: StoredTimer = { timer: IDLE, pushMessageId: null };

// Pure: turns the stored text into a safe StoredTimer. Anything unexpected
// becomes "idle, no push".
export function parseStoredTimer(raw: string | null): StoredTimer {
  if (!raw) return EMPTY;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (typeof data !== "object" || data === null) return EMPTY;
  const { timer, pushMessageId } = data as {
    timer?: { status?: unknown; endTime?: unknown };
    pushMessageId?: unknown;
  };

  const running =
    timer?.status === "running" &&
    typeof timer.endTime === "number" &&
    Number.isFinite(timer.endTime);
  if (!running) return EMPTY;

  // Same shape QStash message ids have; /api/cancel enforces it too.
  const validId =
    typeof pushMessageId === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(pushMessageId);
  return {
    timer: { status: "running", endTime: timer.endTime as number },
    pushMessageId: validId ? (pushMessageId as string) : null,
  };
}

export function loadStoredTimer(): StoredTimer {
  try {
    return parseStoredTimer(localStorage.getItem(KEY));
  } catch {
    return EMPTY; // storage blocked
  }
}

export function saveStoredTimer(stored: StoredTimer): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // Storage full or blocked: the timer still works, it just won't survive a reload.
  }
}
