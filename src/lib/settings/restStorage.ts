// A copy of the rest length kept on this device. It is what makes the timer
// start with your chosen length straight away, even with no signal at the gym.
// The database copy (shared across devices) wins when it can be loaded.
import { parseRestSeconds } from "./restDuration";

export const REST_STORAGE_KEY = "settimer-rest-seconds-v1";

export function loadStoredRestSeconds(): number | null {
  try {
    return parseRestSeconds(localStorage.getItem(REST_STORAGE_KEY));
  } catch {
    return null; // storage blocked
  }
}

export function saveStoredRestSeconds(seconds: number): void {
  try {
    localStorage.setItem(REST_STORAGE_KEY, String(seconds));
  } catch {
    // Storage full or blocked: the setting is still saved in the database.
  }
}
