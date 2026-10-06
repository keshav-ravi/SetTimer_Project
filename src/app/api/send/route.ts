// QStash -> us, at the scheduled end time. Sends the actual push message to
// the phone. Only QStash may call this, so we verify its signature first.

import { NextResponse } from "next/server";
import webpush from "web-push";
import { checkQstashSignature } from "@/lib/push/qstashSignature";
import { parseSubscription } from "@/lib/push/validation";

export async function POST(request: Request) {
  // Read the raw text: the signature covers the exact bytes QStash sent.
  const rawBody = await request.text();

  const rejection = checkQstashSignature({
    signature: request.headers.get("upstash-signature"),
    body: rawBody,
    keys: [
      process.env.QSTASH_CURRENT_SIGNING_KEY ?? "",
      process.env.QSTASH_NEXT_SIGNING_KEY ?? "",
    ],
    now: Date.now(),
  });
  if (rejection !== null) {
    // The reason is safe to log (no keys or message contents).
    console.error(`send: QStash signature rejected: ${rejection}`);
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  // Re-check the subscription (defense in depth). We do NOT re-check the end
  // time window: by now the end time is "now", and a late QStash delivery
  // must not cause the push to be dropped.
  const payload = json as { subscription?: unknown; endTime?: unknown } | null;
  const subscription = parseSubscription(payload?.subscription);
  const endTime = payload?.endTime;
  if (!subscription || typeof endTime !== "number") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    console.error("VAPID environment variables are missing.");
    return NextResponse.json({ error: "Push not configured." }, { status: 500 });
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ endTime }),
      // "high" asks the push service to deliver immediately. TTL is how long
      // it may hold the message if the phone is unreachable.
      { TTL: 120, urgency: "high" },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    // 404/410 = the phone's subscription no longer exists. Nothing to retry.
    if (status === 404 || status === 410) {
      return NextResponse.json({ ok: false, gone: true });
    }
    console.error("push send failed", status);
    return NextResponse.json({ error: "Push send failed." }, { status: 502 });
  }
}
