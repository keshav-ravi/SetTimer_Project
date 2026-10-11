// Turns milliseconds into the "1:30" shown on the timer. Pure.
//
// It rounds UP to whole seconds, so the display reads 0:01 right up until the
// timer ends instead of showing 0:00 a moment too early.
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
