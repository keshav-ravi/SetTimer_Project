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

// ---------------------------------------------------------------------------
// Date math on plain "YYYY-MM-DD" strings. These work in UTC internally so
// daylight saving time can never shift a date by a day.
// ---------------------------------------------------------------------------

function toParts(value: string): [number, number, number] {
  const [year, month, day] = value.split("-").map(Number);
  return [year, month, day];
}

function fromUtcMs(ms: number): string {
  const date = new Date(ms);
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// "2026-01-31" + 1 -> "2026-02-01". `days` may be negative.
export function addDays(value: string, days: number): string {
  const [year, month, day] = toParts(value);
  return fromUtcMs(Date.UTC(year, month - 1, day + days));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// How a workout date is shown: "Today", "Yesterday", "Sun, Oct 11", and with
// the year ("Sat, Dec 20, 2025") when it is not in the same year as today.
export function formatWorkoutDate(value: string, today: string): string {
  if (value === today) return "Today";
  if (value === addDays(today, -1)) return "Yesterday";
  const [year, month, day] = toParts(value);
  const weekday =
    WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const base = `${weekday}, ${MONTHS[month - 1]} ${day}`;
  return year === toParts(today)[0] ? base : `${base}, ${year}`;
}

// The oldest date we accept (this app did not exist before then).
export const EARLIEST_WORKOUT_DATE = "2020-01-01";

// Server-side check: a real date, not absurdly old, and not in the future.
// The server only knows UTC, while the user's "today" can be up to one day
// ahead of UTC (for example in Asia or Australia), so tomorrow-in-UTC is
// allowed. The screen itself blocks anything after the user's own today.
export function isAllowedWorkoutDate(value: string, nowMs: number): boolean {
  if (!isValidDateString(value)) return false;
  const latestAllowed = addDays(fromUtcMs(nowMs), 1);
  return value >= EARLIEST_WORKOUT_DATE && value <= latestAllowed;
}
