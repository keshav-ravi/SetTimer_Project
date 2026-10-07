// Pure rules for usernames and passwords. No React, no network.
//
// Users only ever see a username. Supabase Auth wants an email-shaped value,
// so we map "keshav" to "keshav@users.settimer.app" behind the scenes. No
// email is ever sent to that address (email confirmation is off).

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;

// Internal domain used only to build the mapped address.
const INTERNAL_DOMAIN = "users.settimer.app";

// Usernames are case-insensitive: "Keshav " and "keshav" are the same person.
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

// Returns an error message to show the user, or null if the username is fine.
export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw);
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters.`;
  }
  // Only lowercase letters, numbers and underscores. This also keeps the
  // mapped address valid.
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Username can only use letters, numbers and underscores.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  return null;
}

export function usernameToEmail(raw: string): string {
  return `${normalizeUsername(raw)}@${INTERNAL_DOMAIN}`;
}

// Reverse of usernameToEmail, for showing "Signed in as keshav".
// Returns null for any address that isn't one of ours.
export function emailToUsername(email: string | undefined | null): string | null {
  const suffix = `@${INTERNAL_DOMAIN}`;
  if (!email || !email.endsWith(suffix)) return null;
  return email.slice(0, -suffix.length);
}
