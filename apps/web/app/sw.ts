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

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
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
