"use client";

// Tells the user whether the rest alert will reach them with the phone locked,
// and offers a button to turn it on. This is a simple interim version; the
// guided "add to Home Screen" flow (Req 10) replaces it in slice 4.
import type { AlertsStatus } from "@/lib/timer/alertsStatus";

export default function AlertsNotice({
  status,
  pushIssue,
  onEnable,
}: {
  status: AlertsStatus;
  pushIssue: string | null;
  onEnable: () => void;
}) {
  if (status === "checking") return null;

  const box = "rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm";

  return (
    <div className="flex flex-col gap-2">
      {(status === "needs-permission" || status === "needs-subscription") && (
        <div className={box}>
          <p className="mb-2">
            Turn on rest alerts to get notified when your rest ends, even with
            your phone locked.
          </p>
          <button
            type="button"
            onClick={onEnable}
            className="h-12 w-full rounded-lg bg-foreground text-base font-semibold text-background"
          >
            Turn on rest alerts
          </button>
        </div>
      )}

      {status === "blocked" && (
        <p className={box}>
          Notifications are blocked, so you will only get alerts with the app
          open. Turn them on in your phone&apos;s Settings, then Notifications,
          then SetTimer.
        </p>
      )}

      {status === "unsupported" && (
        <p className={box}>
          Alerts with your phone locked need this app on your Home Screen. On
          iPhone: tap Share, then Add to Home Screen, and open it from there.
        </p>
      )}

      {pushIssue && (
        <p className="text-xs opacity-70">
          Lock-screen alert could not be scheduled ({pushIssue}).
        </p>
      )}
    </div>
  );
}
