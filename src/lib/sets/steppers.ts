// Logic for the +/- buttons next to the reps and weight boxes. Pure, so it
// can be tested without a browser.

export const REPS_STEP = 1;
export const WEIGHT_STEP = 5; // pounds

// Adds `delta` to whatever is typed in the box and keeps the result inside
// [min, max]. An empty or non-numeric box counts as `min` first (so "+" on a
// blank weight box gives 5). Returns text to put back in the box.
export function stepValue(
  current: string,
  delta: number,
  min: number,
  max: number,
): string {
  const parsed = current.trim() === "" ? NaN : Number(current);
  const base = Number.isFinite(parsed) ? parsed : min;
  const next = Math.min(max, Math.max(min, base + delta));
  // Round to 2 decimals so 132.5 + 5 never shows 137.50000000000001.
  return String(Math.round(next * 100) / 100);
}
