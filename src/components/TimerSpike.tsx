"use client";

// Throwaway spike UI. All timer RULES live in lib/timer/timer.ts; this
// component only wires buttons, the clock, alerts and the run log to them.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fireAlert,
  getNotificationPermission,
  primeAudio,
  requestNotificationPermission,
  type AlertResult,
} from "@/lib/alerts";
import {
  formatLogAsTsv,
  deltaSeconds,
  markAlerted,
  markEnded,
  markPushReceived,
  pushDeltaSeconds,
  startRun,
  type RunEntry,
} from "@/lib/runLog";
import {
  cancelPush,
  hasPushSubscription,
  readPushReceipt,
  schedulePush,
  subscribeToPush,
} from "@/lib/push/client";
import { clearSnapshot, loadSnapshot, saveSnapshot } from "@/lib/spikeStorage";
import {
  IDLE,
  getRemainingMs,
  logSet,
  stop,
  tick,
  type TimerState,
} from "@/lib/timer/timer";
import {
  acquireWakeLock,
  isWakeLockSupported,
  releaseWakeLock,
} from "@/lib/wakeLock";

const buttonStyle = { minHeight: 44, minWidth: 44, fontSize: "1rem" };

export default function TimerSpike() {
  const [timer, setTimer] = useState<TimerState>(IDLE);
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [now, setNow] = useState(0);
  const [lastAlert, setLastAlert] = useState<AlertResult | null>(null);
  const [wakeLockHeld, setWakeLockHeld] = useState(false);
  // Browser support is only known after mount, so server and first client
  // render agree (both show "checking...").
  const [wakeLockSupported, setWakeLockSupported] = useState<boolean | null>(null);
  const [notifPermission, setNotifPermission] = useState("unknown");
  const [status, setStatus] = useState("");
  const [pushStatus, setPushStatus] = useState("checking...");

  // Refs always hold the latest values, so the interval callback never
  // reads a stale copy of state. State copies exist only to re-render.
  const timerRef = useRef<TimerState>(IDLE);
  const runsRef = useRef<RunEntry[]>([]);
  // Chain of server calls (schedule / cancel push). Each step waits for the
  // previous one, so a quick Stop can't race ahead of the schedule call.
  // It resolves to the id of the currently scheduled push, or null.
  const pushChainRef = useRef<Promise<string | null>>(Promise.resolve(null));

  // Update refs, screen state and localStorage together.
  const commit = useCallback((nextTimer: TimerState, nextRuns: RunEntry[]) => {
    timerRef.current = nextTimer;
    runsRef.current = nextRuns;
    setTimer(nextTimer);
    setRuns(nextRuns);
    saveSnapshot({ timer: nextTimer, runs: nextRuns });
  }, []);

  // Records that the pushed notification arrived (matched by end time).
  const attachReceipt = useCallback(
    (endTime: number, receivedAt: number) => {
      const nextRuns = runsRef.current.map((r) =>
        r.expectedEnd === endTime ? markPushReceived(r, receivedAt) : r,
      );
      commit(timerRef.current, nextRuns);
    },
    [commit],
  );

  // After the timer ends: if the push already reached the phone (we were
  // frozen or in the background), it already alerted the user, so just log
  // it. Otherwise the page alerts on its own. This is the foreground path.
  const alertOrAttach = useCallback(
    async (endTime: number) => {
      const receivedAt = await readPushReceipt(endTime);
      if (receivedAt !== null) {
        attachReceipt(endTime, receivedAt);
      } else {
        void fireAlert().then(setLastAlert);
      }
    },
    [attachReceipt],
  );

  // Runs on a 250ms interval and whenever the page becomes visible again.
  // Uses tick() so the "end time reached" rule lives in one place.
  const check = useCallback(() => {
    const t = Date.now();
    setNow(t);
    const before = timerRef.current;
    const result = tick(before, t);
    if (!result.expired || before.status !== "running") return;
    // The timer just ended: log when the alert really fired, go idle
    // (tick already did that), and do nothing else. No restart.
    const nextRuns = runsRef.current.map((r) =>
      r.outcome === "pending" ? markAlerted(r, t) : r,
    );
    commit(result.state, nextRuns);
    void releaseWakeLock();
    setWakeLockHeld(false);
    // This run's push is due now; nothing is left to cancel.
    pushChainRef.current = Promise.resolve(null);
    void alertOrAttach(before.endTime);
  }, [commit, alertOrAttach]);

  // On mount: restore saved data, register the service worker, start the clock.
  useEffect(() => {
    // localStorage and Notification only exist in the browser, so this
    // one-time load must happen after mount (reading them during render
    // would not match the server-rendered HTML). Hence the lint exception.
    /* eslint-disable react-hooks/set-state-in-effect */
    const saved = loadSnapshot();
    timerRef.current = saved.timer;
    runsRef.current = saved.runs;
    setTimer(saved.timer);
    setRuns(saved.runs);
    setNow(Date.now());
    setNotifPermission(getNotificationPermission());
    setWakeLockSupported(isWakeLockSupported());
    /* eslint-enable react-hooks/set-state-in-effect */
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        setStatus("Service worker failed to register.");
      });
    }
    void hasPushSubscription().then((has) =>
      setPushStatus(has ? "subscribed" : "not subscribed"),
    );
    const id = setInterval(check, 250);

    // The service worker tells us when a push arrives while the page is alive.
    const onWorkerMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        endTime?: unknown;
        receivedAt?: unknown;
      } | null;
      if (
        data?.type === "push-received" &&
        typeof data.endTime === "number" &&
        typeof data.receivedAt === "number"
      ) {
        attachReceipt(data.endTime, data.receivedAt);
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onWorkerMessage);
    }

    // When the user returns to the page, catch up immediately (timers are
    // throttled while hidden) and re-take the Wake Lock, which the browser
    // drops whenever the page is hidden.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      check();
      if (timerRef.current.status === "running") {
        void acquireWakeLock().then(setWakeLockHeld);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      clearInterval(id);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onWorkerMessage);
      }
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [check, attachReceipt]);

  function handleLogSet() {
    primeAudio(); // must happen inside the tap so iOS allows sound later
    const t = Date.now();
    // Logging while running resets the timer; the old run is recorded as reset.
    let nextRuns = runsRef.current.map((r) =>
      r.outcome === "pending" ? markEnded(r, "reset") : r,
    );
    const next = logSet(t);
    if (next.status === "running") {
      nextRuns = [...nextRuns, startRun(t, t, next.endTime)];
      // Cancel any earlier scheduled push, then schedule the new one.
      const endTime = next.endTime;
      pushChainRef.current = pushChainRef.current.then(async (previousId) => {
        if (previousId) await cancelPush(previousId);
        const result = await schedulePush(endTime);
        setPushStatus(
          result.messageId
            ? "push scheduled"
            : `push NOT scheduled: ${result.error}`,
        );
        return result.messageId ?? null;
      });
    }
    commit(next, nextRuns);
    setNow(t);
    void acquireWakeLock().then(setWakeLockHeld);
  }

  function handleStop() {
    const nextRuns = runsRef.current.map((r) =>
      r.outcome === "pending" ? markEnded(r, "stopped") : r,
    );
    commit(stop(), nextRuns);
    // Cancel the scheduled push so it doesn't fire after a manual stop.
    pushChainRef.current = pushChainRef.current.then(async (id) => {
      if (id) await cancelPush(id);
      return null;
    });
    setPushStatus("push cancelled");
    void releaseWakeLock();
    setWakeLockHeld(false);
  }

  async function handleEnableNotifications() {
    const permission = await requestNotificationPermission();
    setNotifPermission(permission);
    if (permission === "granted") {
      const result = await subscribeToPush();
      setPushStatus(result === "subscribed" ? "subscribed" : `push ${result}`);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatLogAsTsv(runsRef.current));
      setStatus("Log copied.");
    } catch {
      setStatus("Copy failed; select the log text manually.");
    }
  }

  function handleClear() {
    clearSnapshot();
    commit(timerRef.current, []);
  }

  const running = timer.status === "running";
  const remainingSeconds = (getRemainingMs(timer, now) / 1000).toFixed(1);

  return (
    <main style={{ padding: 16, maxWidth: 480 }}>
      <h1>Timer spike</h1>

      <p>
        State: <strong>{timer.status}</strong>
        <br />
        Remaining: <strong>{remainingSeconds}s</strong>
        {timer.status === "running" && (
          <>
            <br />
            Ends at: {new Date(timer.endTime).toLocaleTimeString()}
          </>
        )}
      </p>

      <p>
        <button
          onClick={handleLogSet}
          style={{ ...buttonStyle, minHeight: 64, width: "100%" }}
        >
          Log set
        </button>
      </p>
      <p>
        <button onClick={handleStop} disabled={!running} style={buttonStyle}>
          Stop
        </button>{" "}
        <button onClick={handleEnableNotifications} style={buttonStyle}>
          Enable notifications
        </button>
      </p>

      <p>
        Notifications: {notifPermission}
        <br />
        Push: {pushStatus}
        <br />
        Wake Lock:{" "}
        {wakeLockSupported === null
          ? "checking..."
          : !wakeLockSupported
            ? "unsupported"
            : wakeLockHeld
              ? "held"
              : "not held"}
        <br />
        Last alert channels triggered:{" "}
        {lastAlert
          ? `sound ${lastAlert.sound ? "Y" : "N"}, vibration ${lastAlert.vibration ? "Y" : "N"}, notification ${lastAlert.notification ? "Y" : "N"}`
          : "none yet"}
      </p>

      <h2>Run log</h2>
      <p>
        <button onClick={handleCopy} disabled={runs.length === 0} style={buttonStyle}>
          Copy log
        </button>{" "}
        <button
          onClick={handleClear}
          disabled={running || runs.length === 0}
          style={buttonStyle}
        >
          Clear log
        </button>{" "}
        {status}
      </p>
      <ol reversed>
        {[...runs].reverse().map((r) => (
          <li key={r.id}>
            started {new Date(r.startedAt).toLocaleTimeString()} &rarr;{" "}
            {r.outcome}
            {r.alertFiredAt !== undefined && (
              <>
                , alert {new Date(r.alertFiredAt).toLocaleTimeString()}, delta{" "}
                {deltaSeconds(r)}s
              </>
            )}
            {r.pushReceivedAt !== undefined && (
              <>, push arrived {pushDeltaSeconds(r)}s after end</>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
