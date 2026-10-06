import { describe, expect, it } from "vitest";
import { parseScheduleRequest, parseSubscription } from "./validation";

const NOW = 1_000_000_000_000;
const goodSub = {
  endpoint: "https://web.push.apple.com/abc123",
  keys: { p256dh: "p", auth: "a" },
};

describe("parseSubscription", () => {
  it("accepts Apple, Google, Mozilla and Microsoft push endpoints", () => {
    for (const endpoint of [
      "https://web.push.apple.com/x",
      "https://fcm.googleapis.com/fcm/send/x",
      "https://updates.push.services.mozilla.com/x",
      "https://db5p.notify.windows.com/x",
    ]) {
      expect(parseSubscription({ ...goodSub, endpoint })).not.toBeNull();
    }
  });

  it("rejects other hosts, look-alike hosts and non-https URLs", () => {
    for (const endpoint of [
      "https://evil.example.com/x",
      "https://push.apple.com.evil.com/x",
      "https://notpush.apple.com.attacker.io/x",
      "http://web.push.apple.com/x",
      "not a url",
    ]) {
      expect(parseSubscription({ ...goodSub, endpoint })).toBeNull();
    }
  });

  it("rejects missing keys and non-objects", () => {
    expect(parseSubscription(null)).toBeNull();
    expect(parseSubscription("x")).toBeNull();
    expect(parseSubscription({ endpoint: goodSub.endpoint })).toBeNull();
    expect(
      parseSubscription({ ...goodSub, keys: { p256dh: "p" } }),
    ).toBeNull();
  });
});

describe("parseScheduleRequest", () => {
  it("accepts a valid request", () => {
    const result = parseScheduleRequest(
      { subscription: goodSub, endTime: NOW + 90_000 },
      NOW,
    );
    expect(result).toEqual({
      ok: true,
      value: { subscription: goodSub, endTime: NOW + 90_000 },
    });
  });

  it("rejects an end time that is too far ahead", () => {
    const result = parseScheduleRequest(
      { subscription: goodSub, endTime: NOW + 60 * 60 * 1000 },
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects an end time long in the past", () => {
    const result = parseScheduleRequest(
      { subscription: goodSub, endTime: NOW - 60_000 },
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects non-numeric end times and bad bodies", () => {
    expect(
      parseScheduleRequest({ subscription: goodSub, endTime: "soon" }, NOW).ok,
    ).toBe(false);
    expect(parseScheduleRequest(null, NOW).ok).toBe(false);
    expect(
      parseScheduleRequest({ subscription: {}, endTime: NOW + 1000 }, NOW).ok,
    ).toBe(false);
  });
});
