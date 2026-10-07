// Browser -> us: "please send me a push at endTime".
// We validate the request, then hand QStash a delayed call to /api/send.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishAt } from "@/lib/push/qstash";
import { parseScheduleRequest } from "@/lib/push/validation";

export async function POST(request: Request) {
  // Only signed-in users may schedule or cancel pushes.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = parseScheduleRequest(body, Date.now());
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    // QStash must be able to reach this URL, so it only works on a
    // deployed (public) site, not on localhost.
    const destination = `${new URL(request.url).origin}/api/send`;
    const messageId = await publishAt(
      destination,
      parsed.value,
      Math.ceil(parsed.value.endTime / 1000),
    );
    return NextResponse.json({ messageId });
  } catch (error) {
    console.error("schedule failed", error);
    // The detail is a short message like "QStash publish failed with status
    // 401." It never contains secrets, and it shows up on screen for debugging.
    const detail = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { error: "Could not schedule push.", detail },
      { status: 502 },
    );
  }
}
