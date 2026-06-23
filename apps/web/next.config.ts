import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

// The separate Fastify api. The Next app is frontend-only and proxies all /api +
// /auth traffic to it (same-origin from the browser → first-party cookies, no
// CORS). Override per environment via NEXT_PUBLIC_API_BASE.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

const nextConfig: NextConfig = {
  output: 'standalone',
  // @gelabs/sp ships precompiled ESM with the RSC "use client" directives baked in,
  // so Next consumes it straight from node_modules — no transpilePackages needed.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_BASE}/api/:path*` },
      { source: '/auth/:path*', destination: `${API_BASE}/auth/:path*` },
      // The offline sync-client heartbeats GET /healthz to detect connectivity.
      { source: '/healthz', destination: `${API_BASE}/healthz` },
    ];
  },
};

// PWA: precache the app shell so it loads offline. Serwist injects a WEBPACK config,
// so it's applied ONLY for the production build (`next build --webpack`); dev stays
// plain (no SW — avoids SW/HMR interference).
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
});

export default process.env.NODE_ENV === 'development' ? nextConfig : withSerwist(nextConfig);
