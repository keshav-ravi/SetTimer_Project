import { describe, expect, it } from "vitest";
import { callbackBaseUrl } from "./callbackUrl";

const requestOrigin = "https://request-host.example";

describe("callbackBaseUrl", () => {
  it("uses the production domain in production, ignoring the request's host", () => {
    expect(
      callbackBaseUrl({
        vercelEnv: "production",
        productionHost: "settimer.vercel.app",
        requestOrigin,
      }),
    ).toBe("https://settimer.vercel.app");
  });

  it("prefers an explicit APP_URL, keeping only its origin", () => {
    expect(
      callbackBaseUrl({
        appUrl: "https://settimer.example.com/some/path?x=1",
        vercelEnv: "production",
        productionHost: "settimer.vercel.app",
        requestOrigin,
      }),
    ).toBe("https://settimer.example.com");
  });

  it("falls back to the request's own address outside production", () => {
    expect(
      callbackBaseUrl({
        vercelEnv: "preview",
        productionHost: "settimer.vercel.app",
        requestOrigin,
      }),
    ).toBe(requestOrigin);
    expect(callbackBaseUrl({ requestOrigin: "http://localhost:3000" })).toBe(
      "http://localhost:3000",
    );
  });

  it("falls back safely when production settings are missing", () => {
    expect(callbackBaseUrl({ vercelEnv: "production", requestOrigin })).toBe(
      requestOrigin,
    );
  });

  it("ignores an invalid APP_URL or a suspicious host", () => {
    expect(callbackBaseUrl({ appUrl: "not a url", requestOrigin })).toBe(
      requestOrigin,
    );
    expect(
      callbackBaseUrl({ appUrl: "javascript:alert(1)", requestOrigin }),
    ).toBe(requestOrigin);
    expect(
      callbackBaseUrl({
        vercelEnv: "production",
        productionHost: "evil.test/path?x",
        requestOrigin,
      }),
    ).toBe(requestOrigin);
  });
});
