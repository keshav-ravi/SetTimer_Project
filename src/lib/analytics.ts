// Thin wrapper around PostHog so the rest of the app uses one small API.
// Privacy rule (CLAUDE.md): the only identifier we ever send is the user id.
// Never put a username, email, or workout details in event properties.
import posthog from "posthog-js";

// The events we track from the start.
export type AnalyticsEvent =
  | "sign_up"
  | "workout_started"
  | "set_logged"
  | "timer_started"
  | "timer_completed"
  | "timer_dismissed"
  | "timer_reset";

let initialized = false;

export function initAnalytics(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (initialized || typeof window === "undefined" || !key) return;
  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    // Autocapture records text of clicked elements; we only want our own events.
    autocapture: false,
    // People are only created for identified (signed-in) users.
    person_profiles: "identified_only",
  });
  initialized = true;
}

// Link events to the signed-in user, by id only.
export function identifyUser(userId: string): void {
  if (initialized) posthog.identify(userId);
}

export function resetAnalytics(): void {
  if (initialized) posthog.reset();
}

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  if (initialized) posthog.capture(event, properties);
}
