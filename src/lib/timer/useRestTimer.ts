"use client";

// The browser-side wiring for the rest timer. The RULES live in timer.ts
// (pure, unit tested); this hook only connects them to the clock, the screen,
// alerts, the Wake Lock and the server-scheduled push.
//
// A "hook" is a reusable function that gives a component state and behavior.
// LogScreen calls useRestTimer() and gets back the timer plus start/stop.

import { useCallback, useEffect, useRef, useState } from "react";
import { fireAlert, primeAudio } from "@/lib/alerts";
import { track } from "@/lib/analytics";
import {
  cancelPush,
  pruneOldReceipts,
  readPushReceipt,
  schedulePush,
} from "@/lib/push/client";
import { acquireWakeLock, releaseWakeLock } from "@/lib/wakeLock";
import { loadStoredTimer, saveStoredTimer } from "./storage";
import {
  IDLE,
  getRemainingMs,
  logSet,
  stop as stopRules,
  tick,
  type TimerState,
} from "./timer";

// If we only notice the timer ended long after it did (the page was closed or
// frozen), a beep now would just be confusing. Skip the alert past this.
const STALE_ALERT_MS = 30_000;

export function useRestTimer() {
  const [timer, setTimer] = useState<TimerState>(IDLE);
  const [now, setNow] = useState(0);
  // True after the timer ran out, until the next start or stop. The timer is
  // idle then; this only drives the "Rest over" message.
  const [restOver, setRestOver] = useState(false);
  const [pushIssue, setPushIssue] = useState<string | null>(null);

  // Refs hold the latest values so the interval callback never reads a stale
  // copy of state. State copies exist only to re-render the screen.
  const timerRef = useRef<TimerState>(IDLE);
  const pushIdRef = useRef<string | null>(null);
  // Chain of server calls (schedule / cancel push). Each step waits for the
  // one before, so a quick Stop can't overtake the schedule call. Resolves to
  // the id of the currently scheduled push, or null.
  const pushChainRef = useRef<Promise<string | null>>(Promise.resolve(null));

  const persist = useCallback(() => {
    saveStoredTimer({
      timer: timerRef.current,
      pushMessageId: pushIdRef.current,
    });
  }, []);

  const commitTimer = useCallback(
    (next: TimerState) => {
      timerRef.current = next;
      setTimer(next);
      persist();
    },
    [persist],
  );

  // Pushes are ordered through the chain: cancel the previous one (if any),
  // then schedule the next (if a new end time was given).
  const queuePush = useCallback(
    (endTime: number | null) => {
      pushChainRef.current = pushChainRef.current.then(async (previousId) => {
        if (previousId) await cancelPush(previousId);
        if (endTime === null) {
          pushIdRef.current = null;
          persist();
          return null;
        }
        const result = await schedulePush(endTime);
        pushIdRef.current = result.messageId ?? null;
        setPushIssue(
          result.messageId ? null : (result.error ?? "unknown error"),
        );
        persist();
        return pushIdRef.current;
      });
    },
    [persist],
  );

  // After the timer ends. If the push already reached the phone (we were
  // frozen or in the background) it has alerted the user, so do nothing.
  // Otherwise (app open) the page alerts itself.
  const alertOnExpiry = useCallback(
    async (
      endTime: number,
      noticedAt: number,
      scheduledPush: Promise<string | null>,
    ) => {
      if (noticedAt - endTime > STALE_ALERT_MS) return;
      if ((await readPushReceipt(endTime)) !== null) return;
      // If a push was scheduled it shows the notification itself, so the page
      // only makes sound/vibration. If scheduling failed, the page shows the
      // notification as a fallback.
      const pushScheduled = (await scheduledPush) !== null;
      void fireAlert({ showNotification: !pushScheduled });
    },
    [],
  );

  // Runs every 250ms and whenever the page becomes visible again. tick()
  // holds the "end time reached" rule: alert once, go idle, do nothing else.
  const check = useCallback(() => {
    const t = Date.now();
    const before = timerRef.current;
    // Only save the time (which redraws the screen) while a timer is running:
    // that is what moves the countdown. When idle nothing on screen depends on
    // it, so skipping it avoids four pointless redraws a second.
    if (before.status === "running") setNow(t);
    const result = tick(before, t);
    if (!result.expired || before.status !== "running") return;

    commitTimer(result.state);
    setRestOver(true);
    void releaseWakeLock();
    track("timer_completed");
    // This run's push is due now; nothing is left to cancel. Keep the old
    // chain so alertOnExpiry can tell whether a push had been scheduled.
    const scheduledPush = pushChainRef.current;
    pushChainRef.current = Promise.resolve(null);
    pushIdRef.current = null;
    persist();
    void alertOnExpiry(before.endTime, t, scheduledPush);
  }, [commitTimer, persist, alertOnExpiry]);

  // On mount: restore a saved timer, register the service worker, start the clock.
  useEffect(() => {
    // localStorage only exists in the browser, so this one-time load must run
    // after mount (reading it during render would not match the server HTML).
    /* eslint-disable react-hooks/set-state-in-effect */
    const saved = loadStoredTimer();
    timerRef.current = saved.timer;
    pushIdRef.current = saved.pushMessageId;
    pushChainRef.current = Promise.resolve(saved.pushMessageId);
    setTimer(saved.timer);
    setNow(Date.now());
    /* eslint-enable react-hooks/set-state-in-effect */

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Without the service worker only on-screen alerts work.
      });
    }
    void pruneOldReceipts();
    if (saved.timer.status === "running") {
      void acquireWakeLock();
    }
    const id = setInterval(check, 250);

    // When the user comes back to the app: catch up at once (timers are
    // throttled while hidden), re-take the Wake Lock (the browser drops it
    // whenever the page is hidden).
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      check();
      if (timerRef.current.status === "running") void acquireWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [check]);

  // Called from the Log set tap: start, or reset if already running.
  const start = useCallback(
    (durationSeconds: number) => {
      primeAudio(); // must happen inside the tap so iOS allows sound later
      const t = Date.now();
      const wasRunning = timerRef.current.status === "running";
      const next = logSet(t, durationSeconds);
      if (next.status !== "running") return; // logSet always returns running
      commitTimer(next);
      setNow(t);
      setRestOver(false);
      // rest_seconds is just a number (not personal data); it shows which rest
      // lengths people really choose.
      track(wasRunning ? "timer_reset" : "timer_started", {
        rest_seconds: durationSeconds,
      });
      void acquireWakeLock();
      queuePush(next.endTime);
    },
    [commitTimer, queuePush],
  );

  // Ends the timer early and cancels its push. `dismissed` is true when the
  // user chose to (Stop button); false when we stopped it ourselves (a set
  // failed to save), so only real dismissals are counted in analytics.
  const endEarly = useCallback(
    (dismissed: boolean) => {
      const wasRunning = timerRef.current.status === "running";
      commitTimer(stopRules());
      setRestOver(false);
      void releaseWakeLock();
      queuePush(null);
      if (wasRunning && dismissed) track("timer_dismissed");
    },
    [commitTimer, queuePush],
  );
  const stop = useCallback(() => endEarly(true), [endEarly]);
  const cancel = useCallback(() => endEarly(false), [endEarly]);

  return {
    timer,
    remainingMs: getRemainingMs(timer, now),
    restOver,
    pushIssue,
    start,
    stop,
    cancel,
  };
}
