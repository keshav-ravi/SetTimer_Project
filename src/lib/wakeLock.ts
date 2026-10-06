// Screen Wake Lock: asks the phone not to dim/lock the screen while the
// timer runs. Not every browser supports it, so everything here is
// safe to call when it's missing (it just returns false).

// The browser hands back a "sentinel" object; we keep it so we can release it.
let sentinel: WakeLockSentinel | null = null;

export function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

// Returns true if we now hold the lock. Must be called while the page is
// visible, and the browser may refuse (e.g. low battery), hence try/catch.
export async function acquireWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) return false;
  if (sentinel && !sentinel.released) return true;
  try {
    sentinel = await navigator.wakeLock.request("screen");
    return true;
  } catch {
    sentinel = null;
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  const current = sentinel;
  sentinel = null;
  if (current && !current.released) {
    try {
      await current.release();
    } catch {
      // Already released by the browser; nothing to do.
    }
  }
}
