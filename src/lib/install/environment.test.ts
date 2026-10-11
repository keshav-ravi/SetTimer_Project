import { describe, expect, it } from "vitest";
import { detectEnvironment, type EnvironmentInput } from "./environment";

const base: EnvironmentInput = {
  userAgent: "",
  platform: "",
  maxTouchPoints: 0,
  displayModeStandalone: false,
  navigatorStandalone: undefined,
};

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

describe("detectEnvironment", () => {
  it("detects an iPhone in a Safari tab", () => {
    expect(detectEnvironment({ ...base, userAgent: IPHONE_UA })).toEqual({
      isIos: true,
      isStandalone: false,
    });
  });

  it("detects the installed iPhone app via navigator.standalone", () => {
    expect(
      detectEnvironment({ ...base, userAgent: IPHONE_UA, navigatorStandalone: true }),
    ).toEqual({ isIos: true, isStandalone: true });
  });

  it("detects the installed app via the display-mode media query", () => {
    expect(
      detectEnvironment({ ...base, userAgent: IPHONE_UA, displayModeStandalone: true }),
    ).toEqual({ isIos: true, isStandalone: true });
  });

  it("treats navigator.standalone === false as not installed", () => {
    expect(
      detectEnvironment({ ...base, userAgent: IPHONE_UA, navigatorStandalone: false })
        .isStandalone,
    ).toBe(false);
  });

  it("detects an iPad that reports itself as a Mac", () => {
    expect(
      detectEnvironment({ ...base, userAgent: MAC_UA, platform: "MacIntel", maxTouchPoints: 5 })
        .isIos,
    ).toBe(true);
  });

  it("does not mistake a real Mac (no touch screen) for iOS", () => {
    expect(
      detectEnvironment({ ...base, userAgent: MAC_UA, platform: "MacIntel", maxTouchPoints: 0 })
        .isIos,
    ).toBe(false);
  });

  it("does not treat Android as iOS", () => {
    expect(detectEnvironment({ ...base, userAgent: ANDROID_UA }).isIos).toBe(false);
  });
});
