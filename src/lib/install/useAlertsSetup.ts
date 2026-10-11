"use client";

// Everything about getting rest alerts working on this device: what kind of
// device it is, whether it is installed on the Home Screen, whether
// notifications are allowed, and the two actions the user can take (turn
// alerts on, send a test alert).

import { useCallback, useEffect, useState } from "react";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/alerts";
import {
  hasPushSubscription,
  isPushSupported,
  schedulePush,
  subscribeToPush,
} from "@/lib/push/client";
import { alertsStatus, type AlertsStatus } from "@/lib/timer/alertsStatus";
import { detectEnvironment, type Environment } from "./environment";
import { nextSetupStep, type SetupStep } from "./setupStep";

// How far ahead the test alert is scheduled.
const TEST_ALERT_DELAY_MS = 5_000;

function readEnvironment(): Environment {
  return detectEnvironment({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    displayModeStandalone: window.matchMedia("(display-mode: standalone)")
      .matches,
    // navigator.standalone only exists on iOS, so TypeScript doesn't know it.
    navigatorStandalone: (navigator as Navigator & { standalone?: boolean })
      .standalone,
  });
}

export function useAlertsSetup() {
  const [alerts, setAlerts] = useState<AlertsStatus>("checking");
  const [environment, setEnvironment] = useState<Environment>({
    isIos: false,
    isStandalone: false,
  });

  // Looks at the browser and updates what we know. Safe to call any time.
  const refresh = useCallback(async () => {
    const subscribed = await hasPushSubscription();
    setEnvironment(readEnvironment());
    setAlerts(
      alertsStatus({
        pushSupported: isPushSupported(),
        permission: getNotificationPermission(),
        subscribed,
      }),
    );
  }, []);

  useEffect(() => {
    // Browser details only exist after mount, so the first look happens here.
    // refresh() only updates state after an await (the browser's answer), but
    // the lint rule can't see that, hence the exception.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    // Check again when the user comes back to the app: they may have changed
    // the notification setting in the phone's Settings.
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [refresh]);

  // Must be called straight from a tap: iOS only shows the permission prompt
  // in response to a user action.
  const enableAlerts = useCallback(async () => {
    const permission = await requestNotificationPermission();
    if (permission === "granted") await subscribeToPush();
    await refresh();
  }, [refresh]);

  // Schedules a notification a few seconds from now through the same
  // pipeline as the real timer, so it proves the whole path works.
  const sendTestAlert = useCallback(async (): Promise<string> => {
    const result = await schedulePush(Date.now() + TEST_ALERT_DELAY_MS, {
      test: true,
    });
    return result.messageId
      ? "Test alert sent. Lock your phone or switch apps; it should arrive in a few seconds."
      : `Could not send the test alert (${result.error}).`;
  }, []);

  const step: SetupStep = nextSetupStep({ ...environment, alerts });
  return { step, enableAlerts, sendTestAlert };
}
