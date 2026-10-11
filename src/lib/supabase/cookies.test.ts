import { describe, expect, it } from "vitest";
import { authCookieOptions } from "./cookies";

describe("authCookieOptions", () => {
  it("is HttpOnly and SameSite=Lax in every environment", () => {
    for (const env of ["production", "development", "test", undefined]) {
      expect(authCookieOptions(env)).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
  });

  it("is Secure in production only", () => {
    expect(authCookieOptions("production").secure).toBe(true);
    expect(authCookieOptions("development").secure).toBe(false);
    expect(authCookieOptions(undefined).secure).toBe(false);
  });
});
