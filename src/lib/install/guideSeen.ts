// Remembers (in this browser) that the install guide has been shown, so it
// only opens by itself once. Kept in its own file so account deletion can
// clear it too.

export const GUIDE_SEEN_KEY = "settimer-install-guide-seen-v1";

export function hasSeenGuide(): boolean {
  try {
    return localStorage.getItem(GUIDE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGuideSeen(): void {
  try {
    localStorage.setItem(GUIDE_SEEN_KEY, "1");
  } catch {
    // Storage blocked: the guide may open again next time. That's acceptable.
  }
}
