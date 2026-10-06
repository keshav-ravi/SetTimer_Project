// Server-only helpers that talk to QStash's REST API with plain fetch
// (no extra npm package). QStash holds a message until a chosen time and
// then makes an HTTP call to our /api/send route.

const QSTASH_URL = process.env.QSTASH_URL ?? "https://qstash.upstash.io";

function requireToken(): string {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error("QSTASH_TOKEN is not set.");
  return token;
}

// Asks QStash to POST `payload` to `destination` at `notBeforeSeconds`
// (unix seconds). Returns the message id so we can cancel it later.
export async function publishAt(
  destination: string,
  payload: unknown,
  notBeforeSeconds: number,
): Promise<string> {
  const response = await fetch(`${QSTASH_URL}/v2/publish/${destination}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      "Content-Type": "application/json",
      "Upstash-Not-Before": String(notBeforeSeconds),
      // No retries: a retry could deliver a stale, late alert and would
      // muddy the timing results we're measuring.
      "Upstash-Retries": "0",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`QStash publish failed with status ${response.status}.`);
  }
  const data = (await response.json()) as { messageId?: string };
  if (!data.messageId) throw new Error("QStash returned no messageId.");
  return data.messageId;
}

// Cancels a scheduled message. A 404 just means it was already delivered
// or cancelled, which is fine.
export async function cancelMessage(messageId: string): Promise<void> {
  const response = await fetch(
    `${QSTASH_URL}/v2/messages/${encodeURIComponent(messageId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${requireToken()}` },
    },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`QStash cancel failed with status ${response.status}.`);
  }
}
