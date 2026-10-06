// Validates what the browser sends to /api/schedule. Our server will POST to
// whatever URL is in `subscription.endpoint`, so without checks anyone could
// use us to send requests to arbitrary sites. We only accept the known
// browser push services, and only a short window of end times.

export type PushSubscriptionJson = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

// Hostnames (and their subdomains) of the real push services:
// Apple (iOS/Safari), Google (Chrome/Android), Mozilla, Microsoft.
const ALLOWED_PUSH_HOSTS = [
  "push.apple.com",
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "notify.windows.com",
];

// Rest timers are 90s; allow generous headroom but not hours.
const MAX_AHEAD_MS = 10 * 60 * 1000;
const MAX_PAST_MS = 5 * 1000;

function isAllowedEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    return ALLOWED_PUSH_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith("." + host),
    );
  } catch {
    return false; // not a valid URL
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length < 512;
}

export function parseSubscription(value: unknown): PushSubscriptionJson | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as { endpoint?: unknown; keys?: unknown };
  if (!isNonEmptyString(v.endpoint) || !isAllowedEndpoint(v.endpoint)) {
    return null;
  }
  if (typeof v.keys !== "object" || v.keys === null) return null;
  const keys = v.keys as { p256dh?: unknown; auth?: unknown };
  if (!isNonEmptyString(keys.p256dh) || !isNonEmptyString(keys.auth)) {
    return null;
  }
  return {
    endpoint: v.endpoint,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
  };
}

export type ScheduleRequest = {
  subscription: PushSubscriptionJson;
  endTime: number; // ms since 1970
};

export type ParseResult =
  | { ok: true; value: ScheduleRequest }
  | { ok: false; error: string };

// Used by both /api/schedule (browser -> us) and /api/send (QStash -> us).
export function parseScheduleRequest(body: unknown, now: number): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const b = body as { subscription?: unknown; endTime?: unknown };
  const subscription = parseSubscription(b.subscription);
  if (!subscription) {
    return { ok: false, error: "Invalid or unsupported push subscription." };
  }
  if (typeof b.endTime !== "number" || !Number.isFinite(b.endTime)) {
    return { ok: false, error: "endTime must be a number." };
  }
  if (b.endTime < now - MAX_PAST_MS || b.endTime > now + MAX_AHEAD_MS) {
    return { ok: false, error: "endTime is outside the allowed window." };
  }
  return { ok: true, value: { subscription, endTime: b.endTime } };
}
