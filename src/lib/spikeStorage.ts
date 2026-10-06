// Saves the spike's timer + run log in localStorage so a page reload
// (e.g. the phone discarding the tab while locked) doesn't lose test data
// or forget a countdown that was in progress.

import type { RunEntry } from "./runLog";
import { IDLE, type TimerState } from "./timer/timer";

const KEY = "settimer-spike-v1";

export type SpikeSnapshot = {
  timer: TimerState;
  runs: RunEntry[];
};

export function loadSnapshot(): SpikeSnapshot {
  const empty: SpikeSnapshot = { timer: IDLE, runs: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SpikeSnapshot>;
    return {
      timer: parsed.timer ?? IDLE,
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
    };
  } catch {
    return empty; // corrupt JSON or storage blocked
  }
}

export function saveSnapshot(snapshot: SpikeSnapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // Storage full or blocked (private mode); the spike still works.
  }
}

export function clearSnapshot(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
