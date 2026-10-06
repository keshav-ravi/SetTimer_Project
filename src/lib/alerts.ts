// Fires the end-of-rest alert on three channels: sound, vibration and a
// notification. Each channel is feature-detected and failures are swallowed,
// because the spike's job is to find out which ones actually work.

// One shared audio context. Browsers (especially iOS Safari) only allow
// sound after a user tap, so primeAudio() is called from the Log set click.
let audioCtx: AudioContext | null = null;

export function primeAudio(): void {
  if (typeof window === "undefined") return;
  try {
    audioCtx ??= new window.AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch {
    // No Web Audio support; sound channel will report false.
  }
}

// Three short beeps. Returns true if we managed to schedule them.
function playBeeps(): boolean {
  if (!audioCtx) return false;
  try {
    const start = audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start + i * 0.35);
      osc.stop(start + i * 0.35 + 0.2);
    }
    return true;
  } catch {
    return false;
  }
}

function vibrate(): boolean {
  // navigator.vibrate is missing on iOS Safari.
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return false;
  }
  return navigator.vibrate([300, 150, 300, 150, 300]);
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

// Must be called from a click handler, never on page load.
export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.requestPermission();
}

// We go through the service worker because Android Chrome does not allow
// `new Notification()`; showNotification works there and on iOS PWAs.
async function showNotification(): Promise<boolean> {
  if (getNotificationPermission() !== "granted") return false;
  if (!("serviceWorker" in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("Rest over", {
      body: "Time for your next set.",
      tag: "settimer-rest",
    });
    return true;
  } catch {
    return false;
  }
}

export type AlertResult = {
  sound: boolean;
  vibration: boolean;
  notification: boolean;
};

// "true" means we triggered the channel without an error. It cannot prove
// the user actually heard or felt it; that's what the real-phone test is for.
//
// When a server push is already scheduled it shows its own notification, so
// the page passes showNotification: false to avoid a duplicate banner.
export async function fireAlert(
  options: { showNotification?: boolean } = {},
): Promise<AlertResult> {
  const { showNotification: wantNotification = true } = options;
  const sound = playBeeps();
  const vibration = vibrate();
  const notification = wantNotification ? await showNotification() : false;
  return { sound, vibration, notification };
}
