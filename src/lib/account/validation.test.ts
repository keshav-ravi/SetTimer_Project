import { describe, expect, it } from "vitest";
import { parseDeleteRequest } from "./validation";

describe("parseDeleteRequest", () => {
  it("accepts a password and a valid push id", () => {
    expect(
      parseDeleteRequest({
        password: "my-password-9",
        pushMessageId: "msg_abc-123",
      }),
    ).toEqual({
      ok: true,
      value: { password: "my-password-9", pushMessageId: "msg_abc-123" },
    });
  });

  it("accepts a password with no push id", () => {
    for (const pushMessageId of [null, undefined, ""]) {
      expect(
        parseDeleteRequest({ password: "pw123456", pushMessageId }),
      ).toEqual({
        ok: true,
        value: { password: "pw123456", pushMessageId: null },
      });
    }
  });

  it("keeps spaces in the password exactly as typed", () => {
    expect(
      parseDeleteRequest({ password: "  spaced pw  ", pushMessageId: null }),
    ).toMatchObject({
      ok: true,
      value: { password: "  spaced pw  " },
    });
  });

  it("rejects a missing, empty or non-text password", () => {
    for (const password of [undefined, null, "", 12345678, {}]) {
      expect(
        parseDeleteRequest({ password, pushMessageId: null }),
      ).toMatchObject({ ok: false });
    }
  });

  it("rejects an absurdly long password without checking it", () => {
    expect(
      parseDeleteRequest({ password: "x".repeat(201), pushMessageId: null }),
    ).toMatchObject({
      ok: false,
    });
  });

  it("ignores a push id with unsafe characters instead of failing", () => {
    for (const pushMessageId of ["../../x", "a b", "x".repeat(101), 42, {}]) {
      expect(
        parseDeleteRequest({ password: "pw123456", pushMessageId }),
      ).toEqual({
        ok: true,
        value: { password: "pw123456", pushMessageId: null },
      });
    }
  });
});
