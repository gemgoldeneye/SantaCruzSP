import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, NetworkOnly } from 'serwist';

// Serwist injects the precache manifest (app shell: JS/CSS/HTML) at build time.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Self-hosted OCR engine assets (public/tesseract/) — precached so document
// scanning runs FULLY offline. Without these, tesseract.js fetches its WASM core
// and eng.traineddata from a CDN on first use, which fails with no network.
const OCR_ASSETS: PrecacheEntry[] = [
  '/tesseract/worker.min.js',
  '/tesseract/tesseract-core-lstm.wasm.js',
  '/tesseract/tesseract-core-simd-lstm.wasm.js',
  '/tesseract/tesseract-core-relaxedsimd-lstm.wasm.js',
  '/tesseract/eng.traineddata.gz',
].map((url) => ({ url, revision: 'tesseract-7.0.0' }));

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST ?? []), ...OCR_ASSETS],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // NEVER cache the api/auth proxy. They are same-origin here (next.config
    // rewrites → Fastify), so the SW WOULD intercept them — a cached sync
    // push/pull would corrupt the offline outbox. Always hit the network.
    {
      matcher: ({ url }) => url.pathname.startsWith('/api') || url.pathname.startsWith('/auth'),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
