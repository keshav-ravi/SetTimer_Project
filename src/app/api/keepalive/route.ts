// Called once a day by Vercel Cron (see vercel.json). Supabase's free plan
// pauses a project after 7 days without database activity; this tiny read
// counts as activity. Vercel automatically sends "Authorization: Bearer
// <CRON_SECRET>", so random visitors can't trigger it.

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/security/safeEqual";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(provided, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // The exercise list is public, so the anon key is enough for this read.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { error } = await supabase.from("exercises").select("id").limit(1);
  if (error) {
    console.error("keepalive failed", error.message);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
