import { describe, expect, it } from "vitest";
import { safeEqual } from "./safeEqual";

describe("safeEqual", () => {
  it("is true for identical strings", () => {
    expect(safeEqual("Bearer abc123", "Bearer abc123")).toBe(true);
    expect(safeEqual("", "")).toBe(true);
  });

  it("is false when any character differs", () => {
    expect(safeEqual("Bearer abc123", "Bearer abc124")).toBe(false);
    expect(safeEqual("Xearer abc123", "Bearer abc123")).toBe(false);
  });

  it("is false for different lengths (including a prefix of the secret)", () => {
    expect(safeEqual("Bearer abc", "Bearer abc123")).toBe(false);
    expect(safeEqual("Bearer abc123", "Bearer abc")).toBe(false);
    expect(safeEqual("", "x")).toBe(false);
  });

  it("handles non-ASCII text", () => {
    expect(safeEqual("pässwörd", "pässwörd")).toBe(true);
    expect(safeEqual("pässwörd", "passwörd")).toBe(false);
  });
});
