"use client";

// Starts PostHog once and ties events to the signed-in user's id.
// Renders nothing.
import { useEffect } from "react";
import { identifyUser, initAnalytics, resetAnalytics } from "@/lib/analytics";

export default function AnalyticsProvider({
  userId,
}: {
  userId: string | null;
}) {
  useEffect(() => {
    initAnalytics();
    if (userId) identifyUser(userId);
    else resetAnalytics();
  }, [userId]);

  return null;
}
