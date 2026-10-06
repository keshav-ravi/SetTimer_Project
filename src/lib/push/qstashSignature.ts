// Verifies that a request to /api/send really came from QStash.
// QStash puts a signed token (a JWT, HS256) in the `Upstash-Signature`
// header. We check: the signature matches one of our two signing keys
// (QStash rotates keys, so there is a "current" and a "next"), the token is
// not expired, and the token's body hash matches the body we received.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual needs equal lengths and avoids timing side channels.
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function decodeJson(part: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(part, "base64url").toString("utf8"),
    );
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

// Returns null if the signature is valid, otherwise a short reason string
// (safe to log: it never contains keys or message contents).
export function checkQstashSignature(args: {
  signature: string | null;
  body: string; // the raw request body, exactly as received
  keys: string[]; // current + next signing keys
  now: number; // ms since 1970
}): string | null {
  const { signature, body, now } = args;
  const keys = args.keys.filter((k) => k.length > 0);
  if (keys.length === 0) return "no signing keys configured on the server";
  if (!signature) return "missing Upstash-Signature header";

  const parts = signature.split(".");
  if (parts.length !== 3) return "signature is not a 3-part token";
  const [headerPart, payloadPart, sigPart] = parts;

  const header = decodeJson(headerPart);
  const payload = decodeJson(payloadPart);
  if (!header || !payload) return "token header or payload is not valid JSON";
  if (header.alg !== "HS256") return `unexpected algorithm ${String(header.alg)}`;

  // 1. Signature must match one of the keys.
  const signed = `${headerPart}.${payloadPart}`;
  const signatureOk = keys.some((key) =>
    safeEqual(createHmac("sha256", key).update(signed).digest("base64url"), sigPart),
  );
  if (!signatureOk) return `signature does not match any of ${keys.length} configured key(s)`;

  // 2. Issuer and time window (claims are in seconds).
  const nowSeconds = now / 1000;
  if (payload.iss !== "Upstash") return "unexpected issuer";
  if (typeof payload.exp !== "number" || nowSeconds > payload.exp) {
    return "token expired";
  }
  if (typeof payload.nbf === "number" && nowSeconds < payload.nbf - 5) {
    return "token not valid yet"; // small allowance for clock differences
  }

  // 3. The body must be the one that was signed.
  // QStash may include trailing "=" padding in its base64url hash, while
  // Node's "base64url" output has none, so ignore padding when comparing.
  const bodyHash = createHash("sha256").update(body).digest("base64url");
  if (
    typeof payload.body !== "string" ||
    !safeEqual(payload.body.replace(/=+$/, ""), bodyHash)
  ) {
    return "body hash does not match";
  }
  return null;
}

export function verifyQstashSignature(args: {
  signature: string | null;
  body: string;
  keys: string[];
  now: number;
}): boolean {
  return checkQstashSignature(args) === null;
}
