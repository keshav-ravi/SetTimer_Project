// Dates for workouts. A workout belongs to the day on the USER'S clock, not
// UTC: logging a set at 9pm in Chicago must count as that evening, even though
// it is already "tomorrow" in UTC.

// Returns YYYY-MM-DD using the device's local time zone.
export function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// True for a real calendar date written as YYYY-MM-DD (e.g. not 2026-02-31).
// The server uses this to reject bad input from the browser.
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
