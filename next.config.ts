import type { NextConfig } from "next";

// Security headers sent with every response.
const securityHeaders = [
  // Browsers must not guess a file's type (blocks "type confusion" tricks).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nobody may put SetTimer inside a frame on another site (clickjacking).
  // X-Frame-Options is the old way, frame-ancestors the modern way; send both.
  { key: "X-Frame-Options", value: "DENY" },
  {
    // Only the safe CSP directives. We deliberately do NOT restrict scripts
    // yet: Next.js and PostHog need that tuned and tested carefully.
    //  - frame-ancestors 'none': cannot be framed
    //  - base-uri 'self': an injected <base> tag cannot redirect our links
    //  - form-action 'self': forms can only submit to this site
    //  - object-src 'none': no plugins
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  // Do not leak full page addresses (such as ?date=...) to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We never use these browser features, so switch them off.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Always use https for a year once a browser has seen the site over https.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  // Do not announce "X-Powered-By: Next.js".
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
