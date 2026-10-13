"use client";

// The setup card on the logging screen (Req 10): get the app onto the Home
// Screen, turn rest alerts on, and confirm they work. Which card shows is
// decided by nextSetupStep (pure, tested); this component only displays it.
import { useCallback, useEffect, useState } from "react";
import InstallGuide from "@/components/InstallGuide";
import { hasSeenGuide, markGuideSeen } from "@/lib/install/guideSeen";
import { useAlertsSetup } from "@/lib/install/useAlertsSetup";

const card =
  "rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm";
const cardButton =
  "h-12 w-full rounded-lg bg-accent text-base font-semibold text-on-accent";

export default function SetupFlow() {
  const { step, enableAlerts, sendTestAlert } = useAlertsSetup();
  const [guideOpen, setGuideOpen] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  // On iPhone in Safari, open the install guide by itself the first time.
  useEffect(() => {
    if (step === "install" && !hasSeenGuide()) {
      // A one-time reaction to browser-only information (localStorage and the
      // device type), so it has to run after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGuideOpen(true);
    }
  }, [step]);

  const closeGuide = useCallback(() => {
    markGuideSeen();
    setGuideOpen(false);
  }, []);

  async function handleTest() {
    setSendingTest(true);
    setTestMessage(await sendTestAlert());
    setSendingTest(false);
  }

  return (
    <>
      {guideOpen && <InstallGuide onClose={closeGuide} />}

      {step === "install" && (
        <div className={card}>
          <p className="mb-2">
            Add Rep Rest to your Home Screen to get rest alerts when your phone
            is locked.
          </p>
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className={cardButton}
          >
            Show me how
          </button>
        </div>
      )}

      {step === "enable-alerts" && (
        <div className={card}>
          <p className="mb-2">
            Turn on rest alerts to get notified when your rest ends, even with
            your phone locked.
          </p>
          <button type="button" onClick={enableAlerts} className={cardButton}>
            Turn on rest alerts
          </button>
        </div>
      )}

      {step === "blocked" && (
        <p className={card}>
          Notifications are blocked, so you will only get alerts with the app
          open. To turn them on: open your phone&apos;s{" "}
          <strong>Settings</strong>, then <strong>Notifications</strong>, then{" "}
          <strong>Rep Rest</strong>, and allow notifications. Then come back
          here.
        </p>
      )}

      {step === "update-ios" && (
        <p className={card}>
          Lock-screen alerts need iOS 16.4 or later. Update iOS in Settings,
          then General, then Software Update. Until then you will get alerts
          with the app open.
        </p>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-1 text-sm">
          <p className="opacity-70">Rest alerts are on.</p>
          <button
            type="button"
            onClick={handleTest}
            disabled={sendingTest}
            className="flex min-h-11 items-center self-start font-medium underline disabled:opacity-60"
          >
            {sendingTest ? "Sending..." : "Send a test alert"}
          </button>
          {testMessage && (
            <p role="status" className="opacity-80">
              {testMessage}
            </p>
          )}
        </div>
      )}
    </>
  );
}
