import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "standalone",

  // ─── Type-safety: NEVER ignore TypeScript errors in production builds ──
  // (was previously `ignoreBuildErrors: true` — a critical security risk that
  // masked type errors and let broken code ship to production.)
  typescript: {
    ignoreBuildErrors: false,
  },

  // ─── React strict mode: surface bugs (double-render, deprecated APIs) ──
  // (was previously `false` — re-enabling because the cost is negligible and
  // it catches real bugs in development.)
  reactStrictMode: true,

  // ─── Production security headers ──────────────────────────
  // These complement the headers set in src/middleware.ts.
  // Next.js will apply these to all routes including static assets.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // Service worker must not be cached aggressively — we want updates to ship
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },

  // ─── Production-only: powered-by header is a fingerprint, remove it ──
  poweredByHeader: false,

  // ─── Compression ─────────────────────────────────────────
  compress: true,

  // ─── Image optimization ──────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // ─── Experimental: production logging ────────────────────
  logging: {
    fetches: {
      fullUrl: isProduction ? false : true,
    },
  },
};

export default nextConfig;
