import { describe, expect, it } from "vitest";
import type { AlertsStatus } from "@/lib/timer/alertsStatus";
import { nextSetupStep } from "./setupStep";

const step = (isIos: boolean, isStandalone: boolean, alerts: AlertsStatus) =>
  nextSetupStep({ isIos, isStandalone, alerts });

describe("nextSetupStep", () => {
  it("waits while the browser is still being checked", () => {
    expect(step(true, false, "checking")).toBe("checking");
  });

  it("asks iPhone users in a Safari tab to install first, whatever the alerts status", () => {
    for (const alerts of ["unsupported", "needs-permission", "blocked", "ready"] as const) {
      expect(step(true, false, alerts)).toBe("install");
    }
  });

  it("offers to turn alerts on in the installed iPhone app", () => {
    expect(step(true, true, "needs-permission")).toBe("enable-alerts");
    expect(step(true, true, "needs-subscription")).toBe("enable-alerts");
  });

  it("explains how to unblock notifications", () => {
    expect(step(true, true, "blocked")).toBe("blocked");
  });

  it("tells an installed iPhone that cannot do push to update iOS", () => {
    expect(step(true, true, "unsupported")).toBe("update-ios");
  });

  it("is done when alerts are on", () => {
    expect(step(true, true, "ready")).toBe("done");
    expect(step(false, false, "ready")).toBe("done");
  });

  it("does not nag non-iPhone browsers that simply lack push", () => {
    expect(step(false, false, "unsupported")).toBe("none");
  });

  it("lets non-iPhone browsers turn alerts on without installing", () => {
    expect(step(false, false, "needs-permission")).toBe("enable-alerts");
  });
});
