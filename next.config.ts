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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
