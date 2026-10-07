import { describe, expect, it } from "vitest";
import {
  emailToUsername,
  normalizeUsername,
  usernameToEmail,
  validatePassword,
  validateUsername,
} from "./username";

describe("normalizeUsername", () => {
  it("trims spaces and lowercases", () => {
    expect(normalizeUsername("  Keshav ")).toBe("keshav");
  });
});

describe("validateUsername", () => {
  it("accepts letters, numbers and underscores of valid length", () => {
    expect(validateUsername("keshav_99")).toBeNull();
    expect(validateUsername("abc")).toBeNull();
    expect(validateUsername("a".repeat(20))).toBeNull();
  });

  it("is case-insensitive and ignores surrounding spaces", () => {
    expect(validateUsername("  Keshav  ")).toBeNull();
  });

  it("rejects too short and too long", () => {
    expect(validateUsername("ab")).toMatch(/3-20/);
    expect(validateUsername("a".repeat(21))).toMatch(/3-20/);
  });

  it("rejects spaces, symbols and email-like input", () => {
    expect(validateUsername("kes hav")).toMatch(/letters, numbers/);
    expect(validateUsername("kes-hav")).toMatch(/letters, numbers/);
    expect(validateUsername("kes@hav")).toMatch(/letters, numbers/);
    expect(validateUsername("kesh.av")).toMatch(/letters, numbers/);
  });
});

describe("validatePassword", () => {
  it("requires at least 8 characters", () => {
    expect(validatePassword("1234567")).toMatch(/at least 8/);
    expect(validatePassword("12345678")).toBeNull();
  });
});

describe("usernameToEmail / emailToUsername", () => {
  it("maps a username to the internal address and back", () => {
    const email = usernameToEmail("Keshav");
    expect(email).toBe("keshav@users.settimer.app");
    expect(emailToUsername(email)).toBe("keshav");
  });

  it("returns null for addresses that are not ours", () => {
    expect(emailToUsername("someone@gmail.com")).toBeNull();
    expect(emailToUsername(undefined)).toBeNull();
  });
});
