// Pure checks on a "delete my account" request. No React, no network.

export const PASSWORD_MAX_LENGTH = 200;

export type DeleteRequest = {
  password: string;
  // The id of the user's scheduled rest-timer push, so it can be cancelled.
  // null when there isn't one.
  pushMessageId: string | null;
};

export type ParsedDeleteRequest =
  { ok: true; value: DeleteRequest } | { ok: false; error: string };

// Same shape QStash message ids have; /api/cancel enforces it too.
const PUSH_ID = /^[A-Za-z0-9_-]{1,100}$/;

export function parseDeleteRequest(input: {
  password: unknown;
  pushMessageId: unknown;
}): ParsedDeleteRequest {
  const { password, pushMessageId } = input;
  // Not trimmed: spaces can be part of a password.
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, error: "Enter your password to confirm." };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: "Wrong password." };
  }
  // A missing or odd-looking push id is simply ignored: deleting the account
  // matters more than cancelling a notification that is about to expire.
  const validId =
    typeof pushMessageId === "string" && PUSH_ID.test(pushMessageId);
  return {
    ok: true,
    value: {
      password,
      pushMessageId: validId ? (pushMessageId as string) : null,
    },
  };
}
