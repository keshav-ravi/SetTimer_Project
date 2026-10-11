// Decides the address QStash should call back when the rest alert is due.
// Pure, so it can be tested.
//
// Building it from the incoming request is only as trustworthy as the Host
// header on that request. On Vercel the platform controls it, but it is safer
// not to depend on that, so in production we use the site's own fixed address.

export function callbackBaseUrl(input: {
  appUrl?: string; // optional explicit override (APP_URL)
  vercelEnv?: string; // "production" | "preview" | "development" (set by Vercel)
  productionHost?: string; // the site's public domain (set by Vercel)
  requestOrigin: string; // fallback: the address the request came in on
}): string {
  // 1. An explicit override, if it is a real http(s) address.
  if (input.appUrl) {
    try {
      const url = new URL(input.appUrl);
      if (url.protocol === "https:" || url.protocol === "http:")
        return url.origin;
    } catch {
      // not a valid address: ignore it
    }
  }
  // 2. In production, the fixed public domain Vercel gives us. (Not the
  // per-deployment address: those can sit behind Vercel's login wall, which
  // would block QStash.)
  if (
    input.vercelEnv === "production" &&
    input.productionHost &&
    /^[a-z0-9.-]+$/i.test(input.productionHost)
  ) {
    return `https://${input.productionHost}`;
  }
  // 3. Otherwise (local development, previews) use the request's own address.
  return input.requestOrigin;
}
