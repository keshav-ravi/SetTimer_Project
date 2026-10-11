// Settings for the login cookies. Pure, so it can be unit tested.
//
// - httpOnly: page JavaScript cannot read the login cookie. This app only ever
//   talks to Supabase from the server, so the browser never needs to read it;
//   if a future bug let someone inject script into a page, it still couldn't
//   steal the session.
// - secure: the cookie is only sent over https. It is switched off in local
//   development (plain http://localhost), where some browsers refuse
//   Secure cookies.
// - sameSite "lax": the cookie is not sent on cross-site POSTs (CSRF defense)
//   but still works when following a normal link.

export type AuthCookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
};

export function authCookieOptions(
  nodeEnv: string | undefined,
): AuthCookieOptions {
  return {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  };
}
