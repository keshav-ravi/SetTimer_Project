// Pure rules for the reps and weight a user types in. No React, no network.
// The database enforces the same limits, so a bug here can't store bad data.

export const REPS_MIN = 1;
export const REPS_MAX = 999;
export const WEIGHT_MIN = 0; // 0 is allowed: bodyweight exercises
export const WEIGHT_MAX = 2000; // pounds

export type SetInput = { reps: number; weightLb: number };

export type ParseResult =
  | { ok: true; value: SetInput }
  | { ok: false; error: string };

// Turns what's in the two text boxes into numbers, or an error message.
export function parseSetInput(
  repsRaw: string | number,
  weightRaw: string | number,
): ParseResult {
  const repsText = String(repsRaw).trim();
  const weightText = String(weightRaw).trim();

  // Number("") is 0, so check for empty boxes explicitly.
  if (repsText === "") return { ok: false, error: "Enter the number of reps." };
  if (weightText === "") return { ok: false, error: "Enter the weight (0 for bodyweight)." };

  const reps = Number(repsText);
  if (!Number.isInteger(reps) || reps < REPS_MIN || reps > REPS_MAX) {
    return {
      ok: false,
      error: `Reps must be a whole number from ${REPS_MIN} to ${REPS_MAX}.`,
    };
  }

  const weight = Number(weightText);
  if (!Number.isFinite(weight) || weight < WEIGHT_MIN || weight > WEIGHT_MAX) {
    return {
      ok: false,
      error: `Weight must be from ${WEIGHT_MIN} to ${WEIGHT_MAX} lb.`,
    };
  }

  // Keep at most 2 decimals (matches the database column).
  return { ok: true, value: { reps, weightLb: Math.round(weight * 100) / 100 } };
}
