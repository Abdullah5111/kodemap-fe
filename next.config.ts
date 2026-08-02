import type { NextConfig } from "next";

// Security headers for every response the Next app serves. The API sets its own;
// the frontend previously set none, leaving pages clickjackable and sniffable.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle so the runtime image ships without
  // node_modules or the source tree.
  output: "standalone",
  // Dev-proxy only: Django uses trailing-slash URLs (APPEND_SLASH). Without this,
  // Next redirects /api/foo/ → /api/foo (308) and Django redirects back (301) →
  // a loop. Skipping the trailing-slash redirect lets the rewrite proxy the path
  // through untouched. No effect in prod (frontend calls the API's absolute URL).
  skipTrailingSlashRedirect: !!process.env.DEV_API_PROXY,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Dev-only: when DEV_API_PROXY is set, proxy /api/* to the remote backend so a
  // local frontend talks to production data same-origin (no CORS, and the
  // httpOnly refresh cookie works on http://localhost). Never active in prod
  // builds (the deployed frontend uses the absolute NEXT_PUBLIC_API_URL).
  async rewrites() {
    if (!process.env.DEV_API_PROXY) return [];
    const remote = "https://kodemapapi.14labs.co/api";
    return [
      // Trailing-slash first so Django's APPEND_SLASH routes aren't stripped to a
      // no-slash path (which would redirect-loop). Both rules preserve the slash.
      { source: "/api/:path*/", destination: `${remote}/:path*/` },
      { source: "/api/:path*", destination: `${remote}/:path*` },
    ];
  },
};

export default nextConfig;
