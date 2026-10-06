// Browser-side Web Push helpers: subscribe this phone to push, ask our
// server to schedule / cancel the end-of-rest push, and read back when a
// push actually arrived.

const RECEIPT_CACHE = "settimer-push"; // must match public/sw.js

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

// The VAPID public key is a base64url string; the browser wants raw bytes.
function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

// Returns the existing subscription without prompting anyone.
async function getSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function hasPushSubscription(): Promise<boolean> {
  try {
    return (await getSubscription()) !== null;
  } catch {
    return false;
  }
}

// Creates the subscription. Call only after notification permission is
// granted, from a user action (iOS requires this).
export async function subscribeToPush(): Promise<
  "subscribed" | "unsupported" | "missing-key" | "failed"
> {
  if (!isPushSupported()) return "unsupported";
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return "missing-key";
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) return "subscribed";
    await registration.pushManager.subscribe({
      userVisibleOnly: true, // required: every push must show a notification
      applicationServerKey: base64UrlToBytes(publicKey),
    });
    return "subscribed";
  } catch {
    return "failed";
  }
}

// Asks our server to push at `endTime`. Returns the QStash message id (used
// to cancel), or null if there is no subscription or the call failed.
export async function schedulePush(endTime: number): Promise<string | null> {
  try {
    const subscription = await getSubscription();
    if (!subscription) return null;
    const response = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), endTime }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { messageId?: string };
    return data.messageId ?? null;
  } catch {
    return null;
  }
}

export async function cancelPush(messageId: string): Promise<void> {
  try {
    await fetch("/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
  } catch {
    // Best effort. If this fails, a stale push may still arrive.
  }
}

// The service worker writes the arrival time into the Cache API (it can run
// while the page is frozen). Returns ms since 1970, or null if none arrived.
export async function readPushReceipt(endTime: number): Promise<number | null> {
  try {
    const cache = await caches.open(RECEIPT_CACHE);
    const response = await cache.match(`/push-received/${endTime}`);
    if (!response) return null;
    const value = Number(await response.text());
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
