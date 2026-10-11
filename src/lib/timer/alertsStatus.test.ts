import { describe, expect, it } from "vitest";
import { alertsStatus } from "./alertsStatus";

describe("alertsStatus", () => {
  it("is ready only with permission AND a subscription", () => {
    expect(
      alertsStatus({ pushSupported: true, permission: "granted", subscribed: true }),
    ).toBe("ready");
  });

  it("asks for a subscription when permission is granted but not subscribed", () => {
    expect(
      alertsStatus({ pushSupported: true, permission: "granted", subscribed: false }),
    ).toBe("needs-subscription");
  });

  it("asks for permission when the user has not been asked yet", () => {
    expect(
      alertsStatus({ pushSupported: true, permission: "default", subscribed: false }),
    ).toBe("needs-permission");
  });

  it("reports blocked when notifications were denied", () => {
    expect(
      alertsStatus({ pushSupported: true, permission: "denied", subscribed: false }),
    ).toBe("blocked");
  });

  it("reports unsupported when push or notifications do not exist", () => {
    expect(
      alertsStatus({ pushSupported: false, permission: "default", subscribed: false }),
    ).toBe("unsupported");
    expect(
      alertsStatus({ pushSupported: true, permission: "unsupported", subscribed: false }),
    ).toBe("unsupported");
  });

  it("denied wins even if a stale subscription exists", () => {
    expect(
      alertsStatus({ pushSupported: true, permission: "denied", subscribed: true }),
    ).toBe("blocked");
  });
});
