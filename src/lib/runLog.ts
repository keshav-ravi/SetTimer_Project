// Pure helpers for the spike's on-screen run log. No React, no browser APIs.
// Each "run" is one timer countdown. We record when it started, when it
// SHOULD have ended, and when the alert actually fired, so the delta shows
// how late (or early) the alert was on a real phone.

export type RunOutcome =
  | "pending" // still counting down
  | "alerted" // reached the end and the alert fired
  | "reset" // Log set was tapped again before the end
  | "stopped"; // manual stop before the end

export type RunEntry = {
  id: number;
  startedAt: number; // ms since 1970
  expectedEnd: number; // ms since 1970
  outcome: RunOutcome;
  alertFiredAt?: number; // only set when outcome is "alerted"
  // When the pushed notification reached the phone's service worker. This is
  // the number that matters when the app is locked or in the background.
  pushReceivedAt?: number;
};

export function startRun(
  id: number,
  startedAt: number,
  expectedEnd: number,
): RunEntry {
  return { id, startedAt, expectedEnd, outcome: "pending" };
}

// Returns a new entry (we never mutate), marked as alerted.
export function markAlerted(entry: RunEntry, firedAt: number): RunEntry {
  return { ...entry, outcome: "alerted", alertFiredAt: firedAt };
}

// Records when the push arrived (may be set before or after alertFiredAt).
export function markPushReceived(
  entry: RunEntry,
  receivedAt: number,
): RunEntry {
  return { ...entry, pushReceivedAt: receivedAt };
}

// For runs that ended without an alert (reset or manual stop).
export function markEnded(
  entry: RunEntry,
  outcome: "reset" | "stopped",
): RunEntry {
  return { ...entry, outcome };
}

// Seconds between the expected end and the actual alert, to 1 decimal.
// Positive = late (e.g. 1.2 means 1.2s late). null if no alert fired.
export function deltaSeconds(entry: RunEntry): number | null {
  if (entry.alertFiredAt === undefined) return null;
  return Math.round((entry.alertFiredAt - entry.expectedEnd) / 100) / 10;
}

// Same idea for the push: seconds between the expected end and push arrival.
export function pushDeltaSeconds(entry: RunEntry): number | null {
  if (entry.pushReceivedAt === undefined) return null;
  return Math.round((entry.pushReceivedAt - entry.expectedEnd) / 100) / 10;
}

// Tab-separated text, so it pastes straight into a spreadsheet cell grid.
export function formatLogAsTsv(entries: RunEntry[]): string {
  const header = [
    "started",
    "expected_end",
    "alert_fired",
    "delta_s",
    "push_received",
    "push_delta_s",
    "outcome",
  ].join("\t");
  const rows = entries.map((e) =>
    [
      new Date(e.startedAt).toISOString(),
      new Date(e.expectedEnd).toISOString(),
      e.alertFiredAt === undefined
        ? ""
        : new Date(e.alertFiredAt).toISOString(),
      deltaSeconds(e)?.toString() ?? "",
      e.pushReceivedAt === undefined
        ? ""
        : new Date(e.pushReceivedAt).toISOString(),
      pushDeltaSeconds(e)?.toString() ?? "",
      e.outcome,
    ].join("\t"),
  );
  return [header, ...rows].join("\n");
}
