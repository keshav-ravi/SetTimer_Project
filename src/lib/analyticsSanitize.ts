// Removes details we do not want in analytics. Pure, so it can be tested.
//
// Page addresses can contain a workout date (for example "/?date=2026-10-10"
// when a day is opened from History). The privacy note promises usage events
// carry no workout details, so every address sent to analytics is cut back to
// its path: no "?query" and no "#fragment".

export function stripUrlDetails(value: string): string {
  return value.replace(/[?#].*$/, "");
}

type Bag = Record<string, unknown>;

// Only properties whose name mentions url or referrer are changed.
function cleanBag(bag: Bag | undefined): Bag | undefined {
  if (!bag) return bag;
  const cleaned: Bag = {};
  for (const [key, value] of Object.entries(bag)) {
    cleaned[key] =
      typeof value === "string" && /url|referrer/i.test(key)
        ? stripUrlDetails(value)
        : value;
  }
  return cleaned;
}

type SanitizableEvent = {
  properties?: Bag;
  $set?: Bag;
  $set_once?: Bag;
};

// Used as PostHog's before_send hook. Returns a cleaned copy of the event.
export function sanitizeEvent<T extends SanitizableEvent>(
  event: T | null,
): T | null {
  if (!event) return event;
  const cleaned = { ...event };
  if (event.properties) cleaned.properties = cleanBag(event.properties);
  if (event.$set) cleaned.$set = cleanBag(event.$set);
  if (event.$set_once) cleaned.$set_once = cleanBag(event.$set_once);
  return cleaned;
}
