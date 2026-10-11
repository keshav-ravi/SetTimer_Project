// After an account is deleted, remove what the app left in this browser:
// the push subscription, the saved timer, the install-guide flag, push
// receipts and the analytics identity. Everything is best effort: the account
// is already gone, so a failure here must never block the user.

import { resetAnalytics } from "@/lib/analytics";
import { GUIDE_SEEN_KEY } from "@/lib/install/guideSeen";
import { TIMER_STORAGE_KEY } from "@/lib/timer/storage";
import { releaseWakeLock } from "@/lib/wakeLock";

export async function cleanupLocalData(): Promise<void> {
  try {
    // Tell the push service to forget this phone.
    const registration = await navigator.serviceWorker?.getRegistration();
    const subscription = await registration?.pushManager?.getSubscription();
    await subscription?.unsubscribe();
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(TIMER_STORAGE_KEY);
    localStorage.removeItem(GUIDE_SEEN_KEY);
  } catch {
    // ignore
  }
  try {
    await caches.delete("settimer-push"); // push arrival receipts
  } catch {
    // ignore
  }
  await releaseWakeLock();
  resetAnalytics();
}
