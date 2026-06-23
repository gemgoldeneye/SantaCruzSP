// Side-effect import — configures the sync layer before any data module's
// createCollection() runs. The (staff) layout imports this at module top, above
// the bootSync() call. Same-origin: the Next app proxies /api + /auth to the
// Fastify api (next.config rewrites), so an empty base keeps fetches first-party
// (session cookie) and avoids CORS.
import { initSyncConfig } from '@gelabs/sp/sync-client';

initSyncConfig({ apiBase: '', appKey: 'sp' });
