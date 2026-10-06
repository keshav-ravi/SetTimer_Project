import { createHash, createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyQstashSignature } from "./qstashSignature";

const NOW = 1_800_000_000_000;
const BODY = JSON.stringify({ endTime: NOW + 90_000 });

// Builds a token in the same shape QStash sends, so we can test our checker.
function sign(
  key: string,
  overrides: Record<string, unknown> = {},
  body = BODY,
): string {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const header = b64({ alg: "HS256", typ: "JWT" });
  const payload = b64({
    iss: "Upstash",
    exp: NOW / 1000 + 300,
    nbf: NOW / 1000 - 10,
    body: createHash("sha256").update(body).digest("base64url"),
    ...overrides,
  });
  const sig = createHmac("sha256", key)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

const keys = ["current-key", "next-key"];
const check = (signature: string | null, body = BODY, k = keys) =>
  verifyQstashSignature({ signature, body, keys: k, now: NOW });

describe("verifyQstashSignature", () => {
  it("accepts a valid token signed with the current key", () => {
    expect(check(sign("current-key"))).toBe(true);
  });

  it("accepts a body hash that has trailing = padding", () => {
    const padded =
      createHash("sha256").update(BODY).digest("base64url") + "=";
    expect(check(sign("current-key", { body: padded }))).toBe(true);
  });

  it("accepts a token signed with the next key (key rotation)", () => {
    expect(check(sign("next-key"))).toBe(true);
  });

  it("rejects a token signed with an unknown key", () => {
    expect(check(sign("attacker-key"))).toBe(false);
  });

  it("rejects a body that was changed after signing", () => {
    expect(check(sign("current-key"), BODY + " ")).toBe(false);
  });

  it("rejects an expired token", () => {
    expect(check(sign("current-key", { exp: NOW / 1000 - 1 }))).toBe(false);
  });

  it("rejects a wrong issuer", () => {
    expect(check(sign("current-key", { iss: "someone-else" }))).toBe(false);
  });

  it("rejects a missing header, malformed token, or no configured keys", () => {
    expect(check(null)).toBe(false);
    expect(check("not.a.jwt.token")).toBe(false);
    expect(check(sign("current-key"), BODY, [])).toBe(false);
    expect(check(sign("current-key"), BODY, [""])).toBe(false);
  });
});
