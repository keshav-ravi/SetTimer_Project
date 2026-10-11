// Decides which setup card to show. Pure, so every case is unit tested.
//
// Why iPhone is special: on iPhone, web push (the lock-screen alert) only
// exists in the app installed on the Home Screen. In a Safari tab it is
// missing entirely. So on iPhone, "not installed" always comes first.

import type { AlertsStatus } from "@/lib/timer/alertsStatus";

export type SetupStep =
  | "checking" // still looking at the browser
  | "install" // iPhone, not on the Home Screen yet
  | "enable-alerts" // can turn alerts on with a tap
  | "blocked" // notifications denied; needs the phone's Settings
  | "update-ios" // installed, but this iOS can't do web push (needs 16.4+)
  | "done" // alerts are on
  | "none"; // nothing useful to offer (e.g. a desktop browser without push)

export function nextSetupStep(input: {
  isIos: boolean;
  isStandalone: boolean;
  alerts: AlertsStatus;
}): SetupStep {
  if (input.alerts === "checking") return "checking";
  if (input.isIos && !input.isStandalone) return "install";

  switch (input.alerts) {
    case "needs-permission":
    case "needs-subscription":
      return "enable-alerts";
    case "blocked":
      return "blocked";
    case "unsupported":
      return input.isIos ? "update-ios" : "none";
    case "ready":
      return "done";
  }
}
