// Browser -> us: "please send me a push at endTime".
// We validate the request, then hand QStash a delayed call to /api/send.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callbackBaseUrl } from "@/lib/push/callbackUrl";
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
    // deployed (public) site, not on localhost. In production the address is
    // the site's own fixed domain, not whatever the request claims to be.
    const base = callbackBaseUrl({
      appUrl: process.env.APP_URL,
      vercelEnv: process.env.VERCEL_ENV,
      productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      requestOrigin: new URL(request.url).origin,
    });
    const destination = `${base}/api/send`;
    const messageId = await publishAt(
      destination,
      parsed.value,
      Math.ceil(parsed.value.endTime / 1000),
    );
    return NextResponse.json({ messageId });
  } catch (error) {
    console.error("schedule failed", error);
    // The cause is logged on the server above. The browser only gets a
    // generic message, so we don't reveal details about our setup.
    return NextResponse.json(
      { error: "Could not schedule push." },
      { status: 502 },
    );
  }
}
