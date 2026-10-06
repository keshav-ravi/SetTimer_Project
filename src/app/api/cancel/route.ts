// Browser -> us: "cancel the push I scheduled" (timer reset or stopped).

import { NextResponse } from "next/server";
import { cancelMessage } from "@/lib/push/qstash";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    messageId?: unknown;
  } | null;
  const messageId = body?.messageId;
  // QStash message ids are short alphanumeric strings; reject anything else.
  if (typeof messageId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(messageId)) {
    return NextResponse.json({ error: "Invalid messageId." }, { status: 400 });
  }

  try {
    await cancelMessage(messageId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("cancel failed", error);
    return NextResponse.json({ error: "Could not cancel push." }, { status: 502 });
  }
}
