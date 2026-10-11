// Works out what the "rest alerts" notice should say. Pure: the browser
// checks are done elsewhere and passed in.
//
// "Rest alerts" = notification permission AND a push subscription. Without
// both, the timer still works on screen, but alerts won't arrive when the
// phone is locked.

export type AlertsStatus =
  | "checking" // we haven't looked yet
  | "ready" // everything is on
  | "needs-permission" // user hasn't been asked yet
  | "needs-subscription" // permission granted but not subscribed to push
  | "blocked" // user denied notifications
  | "unsupported"; // e.g. iPhone Safari tab: push only works in the installed app

export function alertsStatus(input: {
  pushSupported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
}): AlertsStatus {
  if (!input.pushSupported || input.permission === "unsupported") {
    return "unsupported";
  }
  if (input.permission === "denied") return "blocked";
  if (input.permission === "default") return "needs-permission";
  return input.subscribed ? "ready" : "needs-subscription";
}
